import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictExitRuleCycleStore } from "./strict-exit-rule-cycle-store.js";
import { newStrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

test("MemoryStrictExitRuleCycleStore finds what it saved", () => {
  const store = newMemoryStrictExitRuleCycleStore();
  const item = newStrictExitRuleCycle("code-957", "name-716");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
