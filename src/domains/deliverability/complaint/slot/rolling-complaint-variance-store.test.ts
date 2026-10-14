import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingComplaintVarianceStore } from "./rolling-complaint-variance-store.js";
import { newRollingComplaintVariance } from "./rolling-complaint-variance.js";

test("MemoryRollingComplaintVarianceStore finds what it saved", () => {
  const store = newMemoryRollingComplaintVarianceStore();
  const item = newRollingComplaintVariance("code-347", "name-372");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
