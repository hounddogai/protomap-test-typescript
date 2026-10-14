import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSenderMilestoneStore } from "./seasonal-sender-milestone-store.js";
import { newSeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

test("MemorySeasonalSenderMilestoneStore finds what it saved", () => {
  const store = newMemorySeasonalSenderMilestoneStore();
  const item = newSeasonalSenderMilestone("code-481", "label-228");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
