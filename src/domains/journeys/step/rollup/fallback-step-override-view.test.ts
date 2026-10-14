import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackStepOverrideView, toFallbackStepOverrideViews } from "./fallback-step-override-view.js";
import { newFallbackStepOverride } from "./fallback-step-override.js";

test("FallbackStepOverrideView shows the status in capitals", () => {
  const item = newFallbackStepOverride("code-671", "label-83");
  const view = toFallbackStepOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackStepOverrideViews([item, item]).length, 2, "views");
});
