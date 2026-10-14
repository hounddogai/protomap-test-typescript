import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveFlightMappingView, toAdaptiveFlightMappingViews } from "./adaptive-flight-mapping-view.js";
import { newAdaptiveFlightMapping } from "./adaptive-flight-mapping.js";

test("AdaptiveFlightMappingView shows the status in capitals", () => {
  const item = newAdaptiveFlightMapping("code-291", "name-967");
  const view = toAdaptiveFlightMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveFlightMappingViews([item, item]).length, 2, "views");
});
