import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceDraftView, toPreferenceDraftViews } from "./preference-draft-view.js";
import { newPreferenceDraft } from "./preference-draft.js";

test("PreferenceDraftView shows the status in capitals", () => {
  const item = newPreferenceDraft("code-59", "label-362");
  const view = toPreferenceDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceDraftViews([item, item]).length, 2, "views");
});
