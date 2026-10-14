import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPostRuleStore } from "./lenient-post-rule-store.js";
import { newLenientPostRule } from "./lenient-post-rule.js";

test("MemoryLenientPostRuleStore finds what it saved", () => {
  const store = newMemoryLenientPostRuleStore();
  const item = newLenientPostRule("code-278", "title-697");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
