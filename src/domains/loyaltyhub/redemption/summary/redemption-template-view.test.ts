import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionTemplateView, toRedemptionTemplateViews } from "./redemption-template-view.js";
import { newRedemptionTemplate } from "./redemption-template.js";

test("RedemptionTemplateView shows the status in capitals", () => {
  const item = newRedemptionTemplate("code-311", "title-547");
  const view = toRedemptionTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionTemplateViews([item, item]).length, 2, "views");
});
