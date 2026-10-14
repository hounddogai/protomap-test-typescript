import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackExitRuleCycleStore } from "./fallback-exit-rule-cycle-store.js";
import { newFallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

test("MemoryFallbackExitRuleCycleStore finds what it saved", () => {
  const store = newMemoryFallbackExitRuleCycleStore();
  const item = newFallbackExitRuleCycle("code-338", "name-11");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
