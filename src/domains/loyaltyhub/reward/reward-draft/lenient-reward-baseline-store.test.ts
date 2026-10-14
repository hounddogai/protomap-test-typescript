import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRewardBaselineStore } from "./lenient-reward-baseline-store.js";
import { newLenientRewardBaseline } from "./lenient-reward-baseline.js";

test("MemoryLenientRewardBaselineStore finds what it saved", () => {
  const store = newMemoryLenientRewardBaselineStore();
  const item = newLenientRewardBaseline("code-937", "label-120");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
