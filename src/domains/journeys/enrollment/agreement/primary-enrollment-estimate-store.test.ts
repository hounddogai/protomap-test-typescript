import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryEnrollmentEstimateStore } from "./primary-enrollment-estimate-store.js";
import { newPrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

test("MemoryPrimaryEnrollmentEstimateStore finds what it saved", () => {
  const store = newMemoryPrimaryEnrollmentEstimateStore();
  const item = newPrimaryEnrollmentEstimate("code-228", "name-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
