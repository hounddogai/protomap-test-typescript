import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceDraftView, toBounceDraftViews } from "./bounce-draft-view.js";
import { newBounceDraft } from "./bounce-draft.js";

test("BounceDraftView shows the status in capitals", () => {
  const item = newBounceDraft("code-809", "title-338");
  const view = toBounceDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceDraftViews([item, item]).length, 2, "views");
});
