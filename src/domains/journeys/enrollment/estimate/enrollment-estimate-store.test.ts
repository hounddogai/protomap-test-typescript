import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentEstimateStore } from "./enrollment-estimate-store.js";
import { newEnrollmentEstimate } from "./enrollment-estimate.js";

test("MemoryEnrollmentEstimateStore finds what it saved", () => {
  const store = newMemoryEnrollmentEstimateStore();
  const item = newEnrollmentEstimate("code-901", "label-796");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
