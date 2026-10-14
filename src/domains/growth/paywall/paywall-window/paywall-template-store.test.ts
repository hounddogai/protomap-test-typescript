import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallTemplateStore } from "./paywall-template-store.js";
import { newPaywallTemplate } from "./paywall-template.js";

test("MemoryPaywallTemplateStore finds what it saved", () => {
  const store = newMemoryPaywallTemplateStore();
  const item = newPaywallTemplate("code-438", "label-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
