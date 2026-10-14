import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroAuditView, toMacroAuditViews } from "./macro-audit-view.js";
import { newMacroAudit } from "./macro-audit.js";

test("MacroAuditView shows the status in capitals", () => {
  const item = newMacroAudit("code-713", "label-331");
  const view = toMacroAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroAuditViews([item, item]).length, 2, "views");
});
