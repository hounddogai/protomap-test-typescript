import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingSummaryStore } from "./pacing-summary-store.js";
import { newPacingSummary } from "./pacing-summary.js";

test("MemoryPacingSummaryStore finds what it saved", () => {
  const store = newMemoryPacingSummaryStore();
  const item = newPacingSummary("code-177", "name-505");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
