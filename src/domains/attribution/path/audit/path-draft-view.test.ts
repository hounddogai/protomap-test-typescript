import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathDraftView, toPathDraftViews } from "./path-draft-view.js";
import { newPathDraft } from "./path-draft.js";

test("PathDraftView shows the status in capitals", () => {
  const item = newPathDraft("code-700", "name-636");
  const view = toPathDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathDraftViews([item, item]).length, 2, "views");
});
