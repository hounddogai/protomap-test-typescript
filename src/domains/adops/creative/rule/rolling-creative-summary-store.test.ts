import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingCreativeSummaryStore } from "./rolling-creative-summary-store.js";
import { newRollingCreativeSummary } from "./rolling-creative-summary.js";

test("MemoryRollingCreativeSummaryStore finds what it saved", () => {
  const store = newMemoryRollingCreativeSummaryStore();
  const item = newRollingCreativeSummary("code-813", "title-203");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
