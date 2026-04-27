// One-shot localStorage migrations. Runs on App boot before any API call.
//
// Purpose: drop legacy queues whose stored shapes are incompatible with the
// post-M3 wire contract (numeric amounts, numeric escrow_id).  Without this,
// an old browser session resuming after the cutover would replay
// schema-invalid POSTs and loop on 400s.
//
// Sentinel `yapbay.migrations.v2` prevents re-runs.

const SENTINEL_KEY = 'yapbay.migrations.v2';

/** Keys that held legacy numeric-amount payloads — drop on first boot. */
const LEGACY_KEYS_TO_DROP = ['pendingTransactions', 'incompleteEscrows'];

export function runStorageMigrations(): void {
  try {
    if (localStorage.getItem(SENTINEL_KEY) === 'true') return;

    let droppedCount = 0;
    for (const key of LEGACY_KEYS_TO_DROP) {
      const v = localStorage.getItem(key);
      if (v !== null) {
        try {
          const parsed = JSON.parse(v);
          if (Array.isArray(parsed)) droppedCount += parsed.length;
        } catch {
          // ignore parse errors; just drop the key
        }
        localStorage.removeItem(key);
      }
    }

    if (droppedCount > 0) {
      console.info(
        `[storage-migrations] dropped ${droppedCount} legacy pending entries (post-M3 incompatible)`,
      );
    }

    localStorage.setItem(SENTINEL_KEY, 'true');
  } catch (err) {
    // Don't let storage migration crash the app — at worst we re-run next boot.
    console.error('[storage-migrations] failed:', err);
  }
}
