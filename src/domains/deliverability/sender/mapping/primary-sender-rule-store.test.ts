import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySenderRuleStore } from "./primary-sender-rule-store.js";
import { newPrimarySenderRule } from "./primary-sender-rule.js";

test("MemoryPrimarySenderRuleStore finds what it saved", () => {
  const store = newMemoryPrimarySenderRuleStore();
  const item = newPrimarySenderRule("code-630", "title-151");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
