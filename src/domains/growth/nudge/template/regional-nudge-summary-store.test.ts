import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalNudgeSummaryStore } from "./regional-nudge-summary-store.js";
import { newRegionalNudgeSummary } from "./regional-nudge-summary.js";

test("MemoryRegionalNudgeSummaryStore finds what it saved", () => {
  const store = newMemoryRegionalNudgeSummaryStore();
  const item = newRegionalNudgeSummary("code-72", "title-350");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
