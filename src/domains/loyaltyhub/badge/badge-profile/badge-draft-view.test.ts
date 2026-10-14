import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeDraftView, toBadgeDraftViews } from "./badge-draft-view.js";
import { newBadgeDraft } from "./badge-draft.js";

test("BadgeDraftView shows the status in capitals", () => {
  const item = newBadgeDraft("code-652", "title-78");
  const view = toBadgeDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeDraftViews([item, item]).length, 2, "views");
});
