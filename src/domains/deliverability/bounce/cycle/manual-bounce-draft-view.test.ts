import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBounceDraftView, toManualBounceDraftViews } from "./manual-bounce-draft-view.js";
import { newManualBounceDraft } from "./manual-bounce-draft.js";

test("ManualBounceDraftView shows the status in capitals", () => {
  const item = newManualBounceDraft("code-136", "title-160");
  const view = toManualBounceDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBounceDraftViews([item, item]).length, 2, "views");
});
