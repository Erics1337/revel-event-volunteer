'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { SignInModal } from '@/components/auth/SignInModal'

interface AuthModalContextType {
  openSignInModal: (options?: { nextPath?: string }) => void
  closeSignInModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [nextPath, setNextPath] = useState('/')

  const closeSignInModal = useCallback(() => {
    setOpen(false)
  }, [])

  const openSignInModal = useCallback(
    (options?: { nextPath?: string }) => {
      setNextPath(options?.nextPath || pathname || '/')
      setModalKey((current) => current + 1)
      setOpen(true)
    },
    [pathname]
  )

  return (
    <AuthModalContext.Provider value={{ openSignInModal, closeSignInModal }}>
      {children}
      {open && (
        <SignInModal
          key={modalKey}
          open={open}
          nextPath={nextPath}
          onClose={closeSignInModal}
        />
      )}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}
