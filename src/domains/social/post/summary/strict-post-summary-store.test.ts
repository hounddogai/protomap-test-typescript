import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPostSummaryStore } from "./strict-post-summary-store.js";
import { newStrictPostSummary } from "./strict-post-summary.js";

test("MemoryStrictPostSummaryStore finds what it saved", () => {
  const store = newMemoryStrictPostSummaryStore();
  const item = newStrictPostSummary("code-433", "title-946");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
