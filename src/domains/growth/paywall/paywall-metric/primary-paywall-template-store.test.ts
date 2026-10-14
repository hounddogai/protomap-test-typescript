import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPaywallTemplateStore } from "./primary-paywall-template-store.js";
import { newPrimaryPaywallTemplate } from "./primary-paywall-template.js";

test("MemoryPrimaryPaywallTemplateStore finds what it saved", () => {
  const store = newMemoryPrimaryPaywallTemplateStore();
  const item = newPrimaryPaywallTemplate("code-930", "name-654");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
