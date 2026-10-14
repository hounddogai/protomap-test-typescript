import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingSenderEntryStore } from "./pending-sender-entry-store.js";
import { newPendingSenderEntry } from "./pending-sender-entry.js";

test("MemoryPendingSenderEntryStore finds what it saved", () => {
  const store = newMemoryPendingSenderEntryStore();
  const item = newPendingSenderEntry("code-938", "label-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
