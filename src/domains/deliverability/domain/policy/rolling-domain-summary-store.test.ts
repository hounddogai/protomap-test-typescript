import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingDomainSummaryStore } from "./rolling-domain-summary-store.js";
import { newRollingDomainSummary } from "./rolling-domain-summary.js";

test("MemoryRollingDomainSummaryStore finds what it saved", () => {
  const store = newMemoryRollingDomainSummaryStore();
  const item = newRollingDomainSummary("code-823", "title-299");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
