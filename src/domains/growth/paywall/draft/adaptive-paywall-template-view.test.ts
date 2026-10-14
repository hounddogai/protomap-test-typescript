import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptivePaywallTemplateView, toAdaptivePaywallTemplateViews } from "./adaptive-paywall-template-view.js";
import { newAdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

test("AdaptivePaywallTemplateView shows the status in capitals", () => {
  const item = newAdaptivePaywallTemplate("code-630", "name-444");
  const view = toAdaptivePaywallTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptivePaywallTemplateViews([item, item]).length, 2, "views");
});
