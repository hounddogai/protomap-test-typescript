import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPaywallTemplateView, toBatchedPaywallTemplateViews } from "./batched-paywall-template-view.js";
import { newBatchedPaywallTemplate } from "./batched-paywall-template.js";

test("BatchedPaywallTemplateView shows the status in capitals", () => {
  const item = newBatchedPaywallTemplate("code-347", "title-89");
  const view = toBatchedPaywallTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPaywallTemplateViews([item, item]).length, 2, "views");
});
