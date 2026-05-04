---
description: Audit volunteer shift locations against the seed shift schedule
---

# Audit volunteer shift locations

Use this workflow before publishing schedule changes or after importing volunteer shifts when the seed spreadsheet schedule is the authoritative volunteer shift location source.

1. Use `supabase/seed.sql` as the authoritative reference for volunteer shift locations and addresses.

1. Use `supabase/seed.sql` as the local reference for known venue names, addresses, and expected volunteer coverage blocks generated from the source spreadsheet. The seed currently defines the canonical addresses for venues such as `Boulder Public Library` and `The Brand Studios at CU`.

1. Check production venue/address values against the seed before reviewing individual shifts:

```sql
select
  name,
  address
from public.venues
order by name;
```

1. Query overlapping volunteer shifts by event day and time window:

```sql
select
  id,
  role,
  day,
  start_time,
  end_time,
  location,
  address,
  filled_slots,
  total_slots,
  notes
from public.volunteer_shifts
where day = '<YYYY-MM-DD>'
  and start_time <= '<SESSION_END_HH:MM>'
  and end_time >= '<SESSION_START_HH:MM>'
order by location, start_time, end_time, role;
```

1. Compare each returned volunteer shift to `supabase/seed.sql`. Treat the seed location as authoritative for where a volunteer should report for that shift.

1. If a mismatch is confirmed, update only explicit reviewed shift IDs:

```sql
update public.volunteer_shifts
set
  location = '<AUTHORITATIVE_SHIFT_LOCATION>',
  address = '<AUTHORITATIVE_SHIFT_ADDRESS>'
where id in (
  '<SHIFT_ID_1>',
  '<SHIFT_ID_2>'
);
```

1. Re-run the query from the overlap-check step and verify the reviewed rows now show the authoritative shift location.

1. Do not use broad updates by time or location alone; overlapping volunteer shifts can exist at multiple venues in the same time window, and `supabase/seed.sql` intentionally includes multiple venue coverage blocks for the same time window.
