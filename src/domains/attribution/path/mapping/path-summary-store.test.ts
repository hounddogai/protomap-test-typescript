import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathSummaryStore } from "./path-summary-store.js";
import { newPathSummary } from "./path-summary.js";

test("MemoryPathSummaryStore finds what it saved", () => {
  const store = newMemoryPathSummaryStore();
  const item = newPathSummary("code-882", "label-261");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
