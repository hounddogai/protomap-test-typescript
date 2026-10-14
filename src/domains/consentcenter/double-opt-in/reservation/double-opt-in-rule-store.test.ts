import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInRuleStore } from "./double-opt-in-rule-store.js";
import { newDoubleOptInRule } from "./double-opt-in-rule.js";

test("MemoryDoubleOptInRuleStore finds what it saved", () => {
  const store = newMemoryDoubleOptInRuleStore();
  const item = newDoubleOptInRule("code-128", "name-91");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
