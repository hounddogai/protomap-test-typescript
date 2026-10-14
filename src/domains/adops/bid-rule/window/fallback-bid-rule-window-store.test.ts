import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBidRuleWindowStore } from "./fallback-bid-rule-window-store.js";
import { newFallbackBidRuleWindow } from "./fallback-bid-rule-window.js";

test("MemoryFallbackBidRuleWindowStore finds what it saved", () => {
  const store = newMemoryFallbackBidRuleWindowStore();
  const item = newFallbackBidRuleWindow("code-317", "label-866");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
