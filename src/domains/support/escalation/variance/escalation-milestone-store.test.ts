import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationMilestoneStore } from "./escalation-milestone-store.js";
import { newEscalationMilestone } from "./escalation-milestone.js";

test("MemoryEscalationMilestoneStore finds what it saved", () => {
  const store = newMemoryEscalationMilestoneStore();
  const item = newEscalationMilestone("code-7", "name-286");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
