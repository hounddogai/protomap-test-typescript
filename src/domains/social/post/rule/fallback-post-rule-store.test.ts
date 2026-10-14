import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPostRuleStore } from "./fallback-post-rule-store.js";
import { newFallbackPostRule } from "./fallback-post-rule.js";

test("MemoryFallbackPostRuleStore finds what it saved", () => {
  const store = newMemoryFallbackPostRuleStore();
  const item = newFallbackPostRule("code-318", "label-415");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
