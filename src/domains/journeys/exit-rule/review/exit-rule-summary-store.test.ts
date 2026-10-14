import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleSummaryStore } from "./exit-rule-summary-store.js";
import { newExitRuleSummary } from "./exit-rule-summary.js";

test("MemoryExitRuleSummaryStore finds what it saved", () => {
  const store = newMemoryExitRuleSummaryStore();
  const item = newExitRuleSummary("code-485", "title-567");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
