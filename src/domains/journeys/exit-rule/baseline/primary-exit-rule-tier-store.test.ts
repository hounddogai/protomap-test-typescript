import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryExitRuleTierStore } from "./primary-exit-rule-tier-store.js";
import { newPrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

test("MemoryPrimaryExitRuleTierStore finds what it saved", () => {
  const store = newMemoryPrimaryExitRuleTierStore();
  const item = newPrimaryExitRuleTier("code-945", "title-466");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
