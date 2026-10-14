import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictMentionPlanStore } from "./strict-mention-plan-store.js";
import { newStrictMentionPlan } from "./strict-mention-plan.js";

test("MemoryStrictMentionPlanStore finds what it saved", () => {
  const store = newMemoryStrictMentionPlanStore();
  const item = newStrictMentionPlan("code-951", "label-766");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
