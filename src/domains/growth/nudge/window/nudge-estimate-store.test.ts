import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeEstimateStore } from "./nudge-estimate-store.js";
import { newNudgeEstimate } from "./nudge-estimate.js";

test("MemoryNudgeEstimateStore finds what it saved", () => {
  const store = newMemoryNudgeEstimateStore();
  const item = newNudgeEstimate("code-244", "label-847");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
