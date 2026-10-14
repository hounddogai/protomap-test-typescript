import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingWaitSummaryStore } from "./pending-wait-summary-store.js";
import { newPendingWaitSummary } from "./pending-wait-summary.js";

test("MemoryPendingWaitSummaryStore finds what it saved", () => {
  const store = newMemoryPendingWaitSummaryStore();
  const item = newPendingWaitSummary("code-411", "title-295");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
