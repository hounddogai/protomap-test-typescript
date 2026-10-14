import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackNudgeEntryStore } from "./fallback-nudge-entry-store.js";
import { newFallbackNudgeEntry } from "./fallback-nudge-entry.js";

test("MemoryFallbackNudgeEntryStore finds what it saved", () => {
  const store = newMemoryFallbackNudgeEntryStore();
  const item = newFallbackNudgeEntry("code-607", "title-836");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
