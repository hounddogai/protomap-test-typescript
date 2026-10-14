import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutTemplateView, toPayoutTemplateViews } from "./payout-template-view.js";
import { newPayoutTemplate } from "./payout-template.js";

test("PayoutTemplateView shows the status in capitals", () => {
  const item = newPayoutTemplate("code-247", "label-703");
  const view = toPayoutTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutTemplateViews([item, item]).length, 2, "views");
});
