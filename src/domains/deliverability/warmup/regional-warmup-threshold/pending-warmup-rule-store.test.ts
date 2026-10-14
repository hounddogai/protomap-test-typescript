import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingWarmupRuleStore } from "./pending-warmup-rule-store.js";
import { newPendingWarmupRule } from "./pending-warmup-rule.js";

test("MemoryPendingWarmupRuleStore finds what it saved", () => {
  const store = newMemoryPendingWarmupRuleStore();
  const item = newPendingWarmupRule("code-95", "name-407");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
