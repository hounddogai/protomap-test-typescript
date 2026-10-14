import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostDraftView, toPostDraftViews } from "./post-draft-view.js";
import { newPostDraft } from "./post-draft.js";

test("PostDraftView shows the status in capitals", () => {
  const item = newPostDraft("code-655", "name-115");
  const view = toPostDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostDraftViews([item, item]).length, 2, "views");
});
