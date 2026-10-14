import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveNudgeMappingView, toAdaptiveNudgeMappingViews } from "./adaptive-nudge-mapping-view.js";
import { newAdaptiveNudgeMapping } from "./adaptive-nudge-mapping.js";

test("AdaptiveNudgeMappingView shows the status in capitals", () => {
  const item = newAdaptiveNudgeMapping("code-601", "name-824");
  const view = toAdaptiveNudgeMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveNudgeMappingViews([item, item]).length, 2, "views");
});
