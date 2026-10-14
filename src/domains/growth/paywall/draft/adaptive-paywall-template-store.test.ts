import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePaywallTemplateStore } from "./adaptive-paywall-template-store.js";
import { newAdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

test("MemoryAdaptivePaywallTemplateStore finds what it saved", () => {
  const store = newMemoryAdaptivePaywallTemplateStore();
  const item = newAdaptivePaywallTemplate("code-630", "name-444");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
