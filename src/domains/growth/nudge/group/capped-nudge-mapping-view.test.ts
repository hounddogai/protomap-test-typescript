import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedNudgeMappingView, toCappedNudgeMappingViews } from "./capped-nudge-mapping-view.js";
import { newCappedNudgeMapping } from "./capped-nudge-mapping.js";

test("CappedNudgeMappingView shows the status in capitals", () => {
  const item = newCappedNudgeMapping("code-694", "label-980");
  const view = toCappedNudgeMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedNudgeMappingViews([item, item]).length, 2, "views");
});
