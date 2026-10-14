import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackReplyBudgetView, toFallbackReplyBudgetViews } from "./fallback-reply-budget-view.js";
import { newFallbackReplyBudget } from "./fallback-reply-budget.js";

test("FallbackReplyBudgetView shows the status in capitals", () => {
  const item = newFallbackReplyBudget("code-530", "name-152");
  const view = toFallbackReplyBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackReplyBudgetViews([item, item]).length, 2, "views");
});
