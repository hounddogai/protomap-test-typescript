import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackEnrollmentBaselineStore } from "./fallback-enrollment-baseline-store.js";
import { newFallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

test("MemoryFallbackEnrollmentBaselineStore finds what it saved", () => {
  const store = newMemoryFallbackEnrollmentBaselineStore();
  const item = newFallbackEnrollmentBaseline("code-919", "label-173");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
