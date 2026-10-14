import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveReputationSummaryStore } from "./adaptive-reputation-summary-store.js";
import { newAdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

test("MemoryAdaptiveReputationSummaryStore finds what it saved", () => {
  const store = newMemoryAdaptiveReputationSummaryStore();
  const item = newAdaptiveReputationSummary("code-118", "title-504");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
