import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchTemplateView, toBranchTemplateViews } from "./branch-template-view.js";
import { newBranchTemplate } from "./branch-template.js";

test("BranchTemplateView shows the status in capitals", () => {
  const item = newBranchTemplate("code-752", "name-188");
  const view = toBranchTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchTemplateViews([item, item]).length, 2, "views");
});
