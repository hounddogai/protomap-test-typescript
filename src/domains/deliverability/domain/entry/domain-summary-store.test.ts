import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainSummaryStore } from "./domain-summary-store.js";
import { newDomainSummary } from "./domain-summary.js";

test("MemoryDomainSummaryStore finds what it saved", () => {
  const store = newMemoryDomainSummaryStore();
  const item = newDomainSummary("code-178", "title-853");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
