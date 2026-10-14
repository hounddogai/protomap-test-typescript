import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPaywallTemplateStore } from "./batched-paywall-template-store.js";
import { newBatchedPaywallTemplate } from "./batched-paywall-template.js";

test("MemoryBatchedPaywallTemplateStore finds what it saved", () => {
  const store = newMemoryBatchedPaywallTemplateStore();
  const item = newBatchedPaywallTemplate("code-347", "title-89");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
