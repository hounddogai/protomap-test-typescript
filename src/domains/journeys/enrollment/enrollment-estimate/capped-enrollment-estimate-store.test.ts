import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedEnrollmentEstimateStore } from "./capped-enrollment-estimate-store.js";
import { newCappedEnrollmentEstimate } from "./capped-enrollment-estimate.js";

test("MemoryCappedEnrollmentEstimateStore finds what it saved", () => {
  const store = newMemoryCappedEnrollmentEstimateStore();
  const item = newCappedEnrollmentEstimate("code-652", "title-890");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
