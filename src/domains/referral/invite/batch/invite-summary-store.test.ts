import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteSummaryStore } from "./invite-summary-store.js";
import { newInviteSummary } from "./invite-summary.js";

test("MemoryInviteSummaryStore finds what it saved", () => {
  const store = newMemoryInviteSummaryStore();
  const item = newInviteSummary("code-621", "label-787");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
