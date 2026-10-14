import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalExitRuleBundleStore } from "./global-exit-rule-bundle-store.js";
import { newGlobalExitRuleBundle } from "./global-exit-rule-bundle.js";

test("MemoryGlobalExitRuleBundleStore finds what it saved", () => {
  const store = newMemoryGlobalExitRuleBundleStore();
  const item = newGlobalExitRuleBundle("code-186", "name-44");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
