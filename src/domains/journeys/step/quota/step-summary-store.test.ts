import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepSummaryStore } from "./step-summary-store.js";
import { newStepSummary } from "./step-summary.js";

test("MemoryStepSummaryStore finds what it saved", () => {
  const store = newMemoryStepSummaryStore();
  const item = newStepSummary("code-418", "name-196");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
