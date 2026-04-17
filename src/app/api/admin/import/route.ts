import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isEventAdmin } from '@/lib/auth/roles'
import Papa from 'papaparse'
import { Database } from '@/lib/supabase/database.types'

type UserRoleLookup = Pick<Database['public']['Tables']['users']['Row'], 'role'>
type CsvRow = Record<string, string>

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !isEventAdmin((profile as UserRoleLookup).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read file content
    const csv = await file.text()

    // Parse CSV using papaparse with RFC 4180 compliance
    const parseResult = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      transform: (value) => value.trim(),
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing failed', 
        details: parseResult.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const rows = parseResult.data as CsvRow[]
    
    // Validate required columns
    const requiredColumns = ['name', 'email']
    const missingColumns = requiredColumns.filter(col => !(col in (rows[0] || {})))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `CSV must have columns: ${missingColumns.join(', ')}` 
      }, { status: 400 })
    }

    // Process and validate rows
    const validUsers: Database['public']['Tables']['users']['Insert'][] = []
    const errors: string[] = []

    rows.forEach((row: CsvRow, index) => {
      const rowNum = index + 2 // Account for header row
      
      if (!row.name || !row.email) {
        errors.push(`Row ${rowNum}: Name and email are required`)
        return
      }

      if (!row.email.includes('@')) {
        errors.push(`Row ${rowNum}: Invalid email format`)
        return
      }

      validUsers.push({
        name: row.name,
        email: row.email.toLowerCase(),
        headline: row.headline || null,
        bio: row.bio || null,
        linkedin_url: row.linkedin_url || null,
        role: 'volunteer',
        badges: [],
        blocked: false,
      })
    })

    if (validUsers.length === 0) {
      return NextResponse.json({ 
        error: 'No valid users found in CSV',
        errors
      }, { status: 400 })
    }

    // Insert users in batches (handle duplicates gracefully)
    let imported = 0
    let skipped = 0

    for (const user of validUsers) {
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert(user)

        if (insertError) {
          if (insertError.code === '23505') { // Unique violation
            skipped++
          } else {
            errors.push(`Failed to import ${user.email}: ${insertError.message}`)
          }
        } else {
          imported++
        }
      } catch (error) {
        errors.push(`Failed to import ${user.email}: ${error}`)
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
