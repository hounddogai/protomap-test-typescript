import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualApprovalDraftView, toManualApprovalDraftViews } from "./manual-approval-draft-view.js";
import { newManualApprovalDraft } from "./manual-approval-draft.js";

test("ManualApprovalDraftView shows the status in capitals", () => {
  const item = newManualApprovalDraft("code-67", "label-256");
  const view = toManualApprovalDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualApprovalDraftViews([item, item]).length, 2, "views");
});
