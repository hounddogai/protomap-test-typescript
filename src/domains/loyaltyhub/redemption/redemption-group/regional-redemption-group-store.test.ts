import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalRedemptionGroupStore } from "./regional-redemption-group-store.js";
import { newRegionalRedemptionGroup } from "./regional-redemption-group.js";

test("MemoryRegionalRedemptionGroupStore finds what it saved", () => {
  const store = newMemoryRegionalRedemptionGroupStore();
  const item = newRegionalRedemptionGroup("code-666", "name-245");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
