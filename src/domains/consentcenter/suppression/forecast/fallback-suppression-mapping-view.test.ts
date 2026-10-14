import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackSuppressionMappingView,
  toFallbackSuppressionMappingViews,
} from "./fallback-suppression-mapping-view.js";
import { newFallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

test("FallbackSuppressionMappingView shows the status in capitals", () => {
  const item = newFallbackSuppressionMapping("code-49", "label-445");
  const view = toFallbackSuppressionMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSuppressionMappingViews([item, item]).length, 2, "views");
});
