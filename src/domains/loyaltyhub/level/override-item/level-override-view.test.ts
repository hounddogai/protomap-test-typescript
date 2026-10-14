import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelOverrideView, toLevelOverrideViews } from "./level-override-view.js";
import { newLevelOverride } from "./level-override.js";

test("LevelOverrideView shows the status in capitals", () => {
  const item = newLevelOverride("code-768", "title-878");
  const view = toLevelOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelOverrideViews([item, item]).length, 2, "views");
});
