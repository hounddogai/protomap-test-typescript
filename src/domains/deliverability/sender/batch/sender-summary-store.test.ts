import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderSummaryStore } from "./sender-summary-store.js";
import { newSenderSummary } from "./sender-summary.js";

test("MemorySenderSummaryStore finds what it saved", () => {
  const store = newMemorySenderSummaryStore();
  const item = newSenderSummary("code-616", "name-239");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
