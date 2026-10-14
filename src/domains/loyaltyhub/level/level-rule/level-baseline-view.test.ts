import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelBaselineView, toLevelBaselineViews } from "./level-baseline-view.js";
import { newLevelBaseline } from "./level-baseline.js";

test("LevelBaselineView shows the status in capitals", () => {
  const item = newLevelBaseline("code-70", "title-340");
  const view = toLevelBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelBaselineViews([item, item]).length, 2, "views");
});
