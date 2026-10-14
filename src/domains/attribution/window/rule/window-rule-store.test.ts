import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowRuleStore } from "./window-rule-store.js";
import { newWindowRule } from "./window-rule.js";

test("MemoryWindowRuleStore finds what it saved", () => {
  const store = newMemoryWindowRuleStore();
  const item = newWindowRule("code-971", "name-43");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
