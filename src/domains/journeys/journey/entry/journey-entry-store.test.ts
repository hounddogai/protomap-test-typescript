import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyEntryStore } from "./journey-entry-store.js";
import { newJourneyEntry } from "./journey-entry.js";

test("MemoryJourneyEntryStore finds what it saved", () => {
  const store = newMemoryJourneyEntryStore();
  const item = newJourneyEntry("code-896", "label-540");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
