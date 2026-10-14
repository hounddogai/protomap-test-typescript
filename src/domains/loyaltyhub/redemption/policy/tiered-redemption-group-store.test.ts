import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRedemptionGroupStore } from "./tiered-redemption-group-store.js";
import { newTieredRedemptionGroup } from "./tiered-redemption-group.js";

test("MemoryTieredRedemptionGroupStore finds what it saved", () => {
  const store = newMemoryTieredRedemptionGroupStore();
  const item = newTieredRedemptionGroup("code-229", "title-479");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
