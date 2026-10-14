import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictReplyBudgetView, toStrictReplyBudgetViews } from "./strict-reply-budget-view.js";
import { newStrictReplyBudget } from "./strict-reply-budget.js";

test("StrictReplyBudgetView shows the status in capitals", () => {
  const item = newStrictReplyBudget("code-320", "label-305");
  const view = toStrictReplyBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictReplyBudgetViews([item, item]).length, 2, "views");
});
