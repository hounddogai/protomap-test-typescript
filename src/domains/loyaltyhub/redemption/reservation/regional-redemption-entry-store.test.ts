import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalRedemptionEntryStore } from "./regional-redemption-entry-store.js";
import { newRegionalRedemptionEntry } from "./regional-redemption-entry.js";

test("MemoryRegionalRedemptionEntryStore finds what it saved", () => {
  const store = newMemoryRegionalRedemptionEntryStore();
  const item = newRegionalRedemptionEntry("code-126", "name-955");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
