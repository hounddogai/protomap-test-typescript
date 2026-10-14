import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleCycleStore } from "./exit-rule-cycle-store.js";
import { newExitRuleCycle } from "./exit-rule-cycle.js";

test("MemoryExitRuleCycleStore finds what it saved", () => {
  const store = newMemoryExitRuleCycleStore();
  const item = newExitRuleCycle("code-842", "title-36");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
