import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardBundleStore } from "./tiered-reward-bundle-store.js";
import { newTieredRewardBundle } from "./tiered-reward-bundle.js";

test("MemoryTieredRewardBundleStore finds what it saved", () => {
  const store = newMemoryTieredRewardBundleStore();
  const item = newTieredRewardBundle("code-57", "name-596");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
