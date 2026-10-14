import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualStepDraftView, toManualStepDraftViews } from "./manual-step-draft-view.js";
import { newManualStepDraft } from "./manual-step-draft.js";

test("ManualStepDraftView shows the status in capitals", () => {
  const item = newManualStepDraft("code-597", "label-986");
  const view = toManualStepDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualStepDraftViews([item, item]).length, 2, "views");
});
