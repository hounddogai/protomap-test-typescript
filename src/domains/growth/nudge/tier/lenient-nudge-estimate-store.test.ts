import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientNudgeEstimateStore } from "./lenient-nudge-estimate-store.js";
import { newLenientNudgeEstimate } from "./lenient-nudge-estimate.js";

test("MemoryLenientNudgeEstimateStore finds what it saved", () => {
  const store = newMemoryLenientNudgeEstimateStore();
  const item = newLenientNudgeEstimate("code-607", "name-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
