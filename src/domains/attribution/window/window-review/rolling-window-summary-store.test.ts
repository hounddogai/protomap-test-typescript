import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingWindowSummaryStore } from "./rolling-window-summary-store.js";
import { newRollingWindowSummary } from "./rolling-window-summary.js";

test("MemoryRollingWindowSummaryStore finds what it saved", () => {
  const store = newMemoryRollingWindowSummaryStore();
  const item = newRollingWindowSummary("code-151", "name-761");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
