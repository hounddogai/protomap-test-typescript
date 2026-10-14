import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteRuleStore } from "./invite-rule-store.js";
import { newInviteRule } from "./invite-rule.js";

test("MemoryInviteRuleStore finds what it saved", () => {
  const store = newMemoryInviteRuleStore();
  const item = newInviteRule("code-674", "name-621");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
