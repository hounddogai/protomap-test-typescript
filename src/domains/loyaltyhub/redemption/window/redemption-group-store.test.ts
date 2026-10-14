import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionGroupStore } from "./redemption-group-store.js";
import { newRedemptionGroup } from "./redemption-group.js";

test("MemoryRedemptionGroupStore finds what it saved", () => {
  const store = newMemoryRedemptionGroupStore();
  const item = newRedemptionGroup("code-67", "name-576");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
