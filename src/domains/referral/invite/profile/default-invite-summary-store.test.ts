import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultInviteSummaryStore } from "./default-invite-summary-store.js";
import { newDefaultInviteSummary } from "./default-invite-summary.js";

test("MemoryDefaultInviteSummaryStore finds what it saved", () => {
  const store = newMemoryDefaultInviteSummaryStore();
  const item = newDefaultInviteSummary("code-31", "name-911");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
