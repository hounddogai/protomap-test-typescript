import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightRuleStore } from "./flight-rule-store.js";
import { newFlightRule } from "./flight-rule.js";

test("MemoryFlightRuleStore finds what it saved", () => {
  const store = newMemoryFlightRuleStore();
  const item = newFlightRule("code-784", "name-994");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
