import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationSummaryStore } from "./reputation-summary-store.js";
import { newReputationSummary } from "./reputation-summary.js";

test("MemoryReputationSummaryStore finds what it saved", () => {
  const store = newMemoryReputationSummaryStore();
  const item = newReputationSummary("code-695", "title-750");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
