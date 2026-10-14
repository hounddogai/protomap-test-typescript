import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalInviteMilestoneStore } from "./seasonal-invite-milestone-store.js";
import { newSeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

test("MemorySeasonalInviteMilestoneStore finds what it saved", () => {
  const store = newMemorySeasonalInviteMilestoneStore();
  const item = newSeasonalInviteMilestone("code-821", "title-98");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
