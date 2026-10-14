import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPacingMappingView, toManualPacingMappingViews } from "./manual-pacing-mapping-view.js";
import { newManualPacingMapping } from "./manual-pacing-mapping.js";

test("ManualPacingMappingView shows the status in capitals", () => {
  const item = newManualPacingMapping("code-949", "label-638");
  const view = toManualPacingMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPacingMappingViews([item, item]).length, 2, "views");
});
