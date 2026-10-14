import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteMilestoneStore } from "./invite-milestone-store.js";
import { newInviteMilestone } from "./invite-milestone.js";

test("MemoryInviteMilestoneStore finds what it saved", () => {
  const store = newMemoryInviteMilestoneStore();
  const item = newInviteMilestone("code-897", "title-229");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
