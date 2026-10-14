import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionEntryStore } from "./redemption-entry-store.js";
import { newRedemptionEntry } from "./redemption-entry.js";

test("MemoryRedemptionEntryStore finds what it saved", () => {
  const store = newMemoryRedemptionEntryStore();
  const item = newRedemptionEntry("code-869", "title-667");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
