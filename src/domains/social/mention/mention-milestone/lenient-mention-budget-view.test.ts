import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientMentionBudgetView, toLenientMentionBudgetViews } from "./lenient-mention-budget-view.js";
import { newLenientMentionBudget } from "./lenient-mention-budget.js";

test("LenientMentionBudgetView shows the status in capitals", () => {
  const item = newLenientMentionBudget("code-861", "title-451");
  const view = toLenientMentionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientMentionBudgetViews([item, item]).length, 2, "views");
});
