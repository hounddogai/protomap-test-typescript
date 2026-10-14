import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalEnrollmentPolicyStore } from "./seasonal-enrollment-policy-store.js";
import { newSeasonalEnrollmentPolicy } from "./seasonal-enrollment-policy.js";

test("MemorySeasonalEnrollmentPolicyStore finds what it saved", () => {
  const store = newMemorySeasonalEnrollmentPolicyStore();
  const item = newSeasonalEnrollmentPolicy("code-280", "label-44");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
