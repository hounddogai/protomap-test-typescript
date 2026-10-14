import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallTemplateView, toPaywallTemplateViews } from "./paywall-template-view.js";
import { newPaywallTemplate } from "./paywall-template.js";

test("PaywallTemplateView shows the status in capitals", () => {
  const item = newPaywallTemplate("code-438", "label-906");
  const view = toPaywallTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallTemplateViews([item, item]).length, 2, "views");
});
