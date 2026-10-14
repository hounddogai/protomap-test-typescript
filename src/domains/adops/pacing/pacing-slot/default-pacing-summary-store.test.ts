import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPacingSummaryStore } from "./default-pacing-summary-store.js";
import { newDefaultPacingSummary } from "./default-pacing-summary.js";

test("MemoryDefaultPacingSummaryStore finds what it saved", () => {
  const store = newMemoryDefaultPacingSummaryStore();
  const item = newDefaultPacingSummary("code-563", "label-729");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
