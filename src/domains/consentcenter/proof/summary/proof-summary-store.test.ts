import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofSummaryStore } from "./proof-summary-store.js";
import { newProofSummary } from "./proof-summary.js";

test("MemoryProofSummaryStore finds what it saved", () => {
  const store = newMemoryProofSummaryStore();
  const item = newProofSummary("code-350", "name-32");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
