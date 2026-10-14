import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentSummaryStore } from "./enrollment-summary-store.js";
import { newEnrollmentSummary } from "./enrollment-summary.js";

test("MemoryEnrollmentSummaryStore finds what it saved", () => {
  const store = newMemoryEnrollmentSummaryStore();
  const item = newEnrollmentSummary("code-390", "title-873");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
