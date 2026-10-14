import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictBidRuleWindowStore } from "./strict-bid-rule-window-store.js";
import { newStrictBidRuleWindow } from "./strict-bid-rule-window.js";

test("MemoryStrictBidRuleWindowStore finds what it saved", () => {
  const store = newMemoryStrictBidRuleWindowStore();
  const item = newStrictBidRuleWindow("code-945", "title-323");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
