import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalCreativeSummaryStore } from "./global-creative-summary-store.js";
import { newGlobalCreativeSummary } from "./global-creative-summary.js";

test("MemoryGlobalCreativeSummaryStore finds what it saved", () => {
  const store = newMemoryGlobalCreativeSummaryStore();
  const item = newGlobalCreativeSummary("code-825", "label-187");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
