import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingNudgeMappingView, toRollingNudgeMappingViews } from "./rolling-nudge-mapping-view.js";
import { newRollingNudgeMapping } from "./rolling-nudge-mapping.js";

test("RollingNudgeMappingView shows the status in capitals", () => {
  const item = newRollingNudgeMapping("code-515", "title-883");
  const view = toRollingNudgeMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingNudgeMappingViews([item, item]).length, 2, "views");
});
