import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveEnrollmentGroupStore } from "./adaptive-enrollment-group-store.js";
import { newAdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

test("MemoryAdaptiveEnrollmentGroupStore finds what it saved", () => {
  const store = newMemoryAdaptiveEnrollmentGroupStore();
  const item = newAdaptiveEnrollmentGroup("code-980", "label-68");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
