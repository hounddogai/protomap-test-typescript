import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryReplyBudgetView, toPrimaryReplyBudgetViews } from "./primary-reply-budget-view.js";
import { newPrimaryReplyBudget } from "./primary-reply-budget.js";

test("PrimaryReplyBudgetView shows the status in capitals", () => {
  const item = newPrimaryReplyBudget("code-647", "title-908");
  const view = toPrimaryReplyBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryReplyBudgetViews([item, item]).length, 2, "views");
});
