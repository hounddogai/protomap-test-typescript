import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceSummaryStore } from "./bounce-summary-store.js";
import { newBounceSummary } from "./bounce-summary.js";

test("MemoryBounceSummaryStore finds what it saved", () => {
  const store = newMemoryBounceSummaryStore();
  const item = newBounceSummary("code-791", "label-22");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
