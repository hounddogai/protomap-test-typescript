import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionPlanStore } from "./mention-plan-store.js";
import { newMentionPlan } from "./mention-plan.js";

test("MemoryMentionPlanStore finds what it saved", () => {
  const store = newMemoryMentionPlanStore();
  const item = newMentionPlan("code-541", "label-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
