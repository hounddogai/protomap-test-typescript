import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCreativeWindowView, toLegacyCreativeWindowViews } from "./legacy-creative-window-view.js";
import { newLegacyCreativeWindow } from "./legacy-creative-window.js";

test("LegacyCreativeWindowView shows the status in capitals", () => {
  const item = newLegacyCreativeWindow("code-143", "name-329");
  const view = toLegacyCreativeWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCreativeWindowViews([item, item]).length, 2, "views");
});
