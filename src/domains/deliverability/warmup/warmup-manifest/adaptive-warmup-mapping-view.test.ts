import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveWarmupMappingView, toAdaptiveWarmupMappingViews } from "./adaptive-warmup-mapping-view.js";
import { newAdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

test("AdaptiveWarmupMappingView shows the status in capitals", () => {
  const item = newAdaptiveWarmupMapping("code-217", "name-47");
  const view = toAdaptiveWarmupMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveWarmupMappingViews([item, item]).length, 2, "views");
});
