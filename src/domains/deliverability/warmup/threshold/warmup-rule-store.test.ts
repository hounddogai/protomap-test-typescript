import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupRuleStore } from "./warmup-rule-store.js";
import { newWarmupRule } from "./warmup-rule.js";

test("MemoryWarmupRuleStore finds what it saved", () => {
  const store = newMemoryWarmupRuleStore();
  const item = newWarmupRule("code-934", "title-13");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
