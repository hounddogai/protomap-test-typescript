import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveReplyBudgetView, toAdaptiveReplyBudgetViews } from "./adaptive-reply-budget-view.js";
import { newAdaptiveReplyBudget } from "./adaptive-reply-budget.js";

test("AdaptiveReplyBudgetView shows the status in capitals", () => {
  const item = newAdaptiveReplyBudget("code-142", "name-889");
  const view = toAdaptiveReplyBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveReplyBudgetViews([item, item]).length, 2, "views");
});
