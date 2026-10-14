import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveInviteSummaryStore } from "./adaptive-invite-summary-store.js";
import { newAdaptiveInviteSummary } from "./adaptive-invite-summary.js";

test("MemoryAdaptiveInviteSummaryStore finds what it saved", () => {
  const store = newMemoryAdaptiveInviteSummaryStore();
  const item = newAdaptiveInviteSummary("code-450", "title-271");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
