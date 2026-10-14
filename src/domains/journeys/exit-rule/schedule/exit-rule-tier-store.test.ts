import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleTierStore } from "./exit-rule-tier-store.js";
import { newExitRuleTier } from "./exit-rule-tier.js";

test("MemoryExitRuleTierStore finds what it saved", () => {
  const store = newMemoryExitRuleTierStore();
  const item = newExitRuleTier("code-87", "label-4");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
