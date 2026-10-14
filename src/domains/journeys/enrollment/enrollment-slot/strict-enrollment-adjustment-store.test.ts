import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictEnrollmentAdjustmentStore } from "./strict-enrollment-adjustment-store.js";
import { newStrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

test("MemoryStrictEnrollmentAdjustmentStore finds what it saved", () => {
  const store = newMemoryStrictEnrollmentAdjustmentStore();
  const item = newStrictEnrollmentAdjustment("code-817", "name-223");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
