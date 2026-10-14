import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleBundleStore } from "./exit-rule-bundle-store.js";
import { newExitRuleBundle } from "./exit-rule-bundle.js";

test("MemoryExitRuleBundleStore finds what it saved", () => {
  const store = newMemoryExitRuleBundleStore();
  const item = newExitRuleBundle("code-428", "name-589");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
