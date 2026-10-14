import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditSummaryStore } from "./credit-summary-store.js";
import { newCreditSummary } from "./credit-summary.js";

test("MemoryCreditSummaryStore finds what it saved", () => {
  const store = newMemoryCreditSummaryStore();
  const item = newCreditSummary("code-810", "name-821");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
