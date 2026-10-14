import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentRuleStore } from "./enrollment-rule-store.js";
import { newEnrollmentRule } from "./enrollment-rule.js";

test("MemoryEnrollmentRuleStore finds what it saved", () => {
  const store = newMemoryEnrollmentRuleStore();
  const item = newEnrollmentRule("code-826", "label-756");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
