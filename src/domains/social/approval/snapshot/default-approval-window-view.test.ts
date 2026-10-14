import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultApprovalWindowView, toDefaultApprovalWindowViews } from "./default-approval-window-view.js";
import { newDefaultApprovalWindow } from "./default-approval-window.js";

test("DefaultApprovalWindowView shows the status in capitals", () => {
  const item = newDefaultApprovalWindow("code-286", "name-968");
  const view = toDefaultApprovalWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultApprovalWindowViews([item, item]).length, 2, "views");
});
