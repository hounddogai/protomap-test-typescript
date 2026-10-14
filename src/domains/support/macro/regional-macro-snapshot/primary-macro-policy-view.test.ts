import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryMacroPolicyView, toPrimaryMacroPolicyViews } from "./primary-macro-policy-view.js";
import { newPrimaryMacroPolicy } from "./primary-macro-policy.js";

test("PrimaryMacroPolicyView shows the status in capitals", () => {
  const item = newPrimaryMacroPolicy("code-56", "title-305");
  const view = toPrimaryMacroPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryMacroPolicyViews([item, item]).length, 2, "views");
});
