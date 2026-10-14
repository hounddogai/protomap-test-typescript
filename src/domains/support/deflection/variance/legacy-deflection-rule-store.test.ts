import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDeflectionRuleStore } from "./legacy-deflection-rule-store.js";
import { newLegacyDeflectionRule } from "./legacy-deflection-rule.js";

test("MemoryLegacyDeflectionRuleStore finds what it saved", () => {
  const store = newMemoryLegacyDeflectionRuleStore();
  const item = newLegacyDeflectionRule("code-522", "title-864");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
