import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWindowDraftView, toLegacyWindowDraftViews } from "./legacy-window-draft-view.js";
import { newLegacyWindowDraft } from "./legacy-window-draft.js";

test("LegacyWindowDraftView shows the status in capitals", () => {
  const item = newLegacyWindowDraft("code-995", "name-309");
  const view = toLegacyWindowDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWindowDraftViews([item, item]).length, 2, "views");
});
