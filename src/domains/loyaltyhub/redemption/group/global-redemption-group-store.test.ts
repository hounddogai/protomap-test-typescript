import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRedemptionGroupStore } from "./global-redemption-group-store.js";
import { newGlobalRedemptionGroup } from "./global-redemption-group.js";

test("MemoryGlobalRedemptionGroupStore finds what it saved", () => {
  const store = newMemoryGlobalRedemptionGroupStore();
  const item = newGlobalRedemptionGroup("code-945", "name-418");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
