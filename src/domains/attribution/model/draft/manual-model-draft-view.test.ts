import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualModelDraftView, toManualModelDraftViews } from "./manual-model-draft-view.js";
import { newManualModelDraft } from "./manual-model-draft.js";

test("ManualModelDraftView shows the status in capitals", () => {
  const item = newManualModelDraft("code-17", "label-126");
  const view = toManualModelDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualModelDraftViews([item, item]).length, 2, "views");
});
