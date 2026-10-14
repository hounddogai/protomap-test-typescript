import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleProfileStore } from "./exit-rule-profile-store.js";
import { newExitRuleProfile } from "./exit-rule-profile.js";

test("MemoryExitRuleProfileStore finds what it saved", () => {
  const store = newMemoryExitRuleProfileStore();
  const item = newExitRuleProfile("code-286", "label-458");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
