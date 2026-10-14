import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveExitRuleBundleStore } from "./adaptive-exit-rule-bundle-store.js";
import { newAdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

test("MemoryAdaptiveExitRuleBundleStore finds what it saved", () => {
  const store = newMemoryAdaptiveExitRuleBundleStore();
  const item = newAdaptiveExitRuleBundle("code-735", "name-698");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
