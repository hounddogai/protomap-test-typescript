import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCreativeDraftView, toStrictCreativeDraftViews } from "./strict-creative-draft-view.js";
import { newStrictCreativeDraft } from "./strict-creative-draft.js";

test("StrictCreativeDraftView shows the status in capitals", () => {
  const item = newStrictCreativeDraft("code-742", "name-833");
  const view = toStrictCreativeDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCreativeDraftViews([item, item]).length, 2, "views");
});
