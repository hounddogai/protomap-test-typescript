import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardBundleStore } from "./reward-bundle-store.js";
import { newRewardBundle } from "./reward-bundle.js";

test("MemoryRewardBundleStore finds what it saved", () => {
  const store = newMemoryRewardBundleStore();
  const item = newRewardBundle("code-724", "label-3");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
