import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepDraftView, toStepDraftViews } from "./step-draft-view.js";
import { newStepDraft } from "./step-draft.js";

test("StepDraftView shows the status in capitals", () => {
  const item = newStepDraft("code-983", "label-486");
  const view = toStepDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepDraftViews([item, item]).length, 2, "views");
});
