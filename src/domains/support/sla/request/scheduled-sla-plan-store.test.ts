import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledSlaPlanStore } from "./scheduled-sla-plan-store.js";
import { newScheduledSlaPlan } from "./scheduled-sla-plan.js";

test("MemoryScheduledSlaPlanStore finds what it saved", () => {
  const store = newMemoryScheduledSlaPlanStore();
  const item = newScheduledSlaPlan("code-936", "name-904");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
