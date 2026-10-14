import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingWaitRuleStore } from "./rolling-wait-rule-store.js";
import { newRollingWaitRule } from "./rolling-wait-rule.js";

test("MemoryRollingWaitRuleStore finds what it saved", () => {
  const store = newMemoryRollingWaitRuleStore();
  const item = newRollingWaitRule("code-864", "title-473");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
