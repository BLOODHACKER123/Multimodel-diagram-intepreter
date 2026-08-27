export function LiveAnnouncer() {
  return (
    <>
      <div id="live-polite" aria-live="polite" aria-atomic="true" className="sr-only" />
      <div id="live-assertive" aria-live="assertive" aria-atomic="true" className="sr-only" />
    </>
  )
}
