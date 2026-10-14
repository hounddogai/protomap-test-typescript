import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleWindowStore } from "./bid-rule-window-store.js";
import { newBidRuleWindow } from "./bid-rule-window.js";

test("MemoryBidRuleWindowStore finds what it saved", () => {
  const store = newMemoryBidRuleWindowStore();
  const item = newBidRuleWindow("code-23", "label-631");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
