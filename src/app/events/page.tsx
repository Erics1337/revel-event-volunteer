import { redirect } from 'next/navigation'

// This app is volunteer-only: "events" for a volunteer means the shifts
// they can sign up for. The canonical shift browser lives at /volunteers,
// so /events is preserved as a friendly alias that redirects there.
export default function EventsPage() {
  redirect('/volunteers')
}
