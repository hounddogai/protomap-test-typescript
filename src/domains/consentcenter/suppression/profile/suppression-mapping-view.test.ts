import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionMappingView, toSuppressionMappingViews } from "./suppression-mapping-view.js";
import { newSuppressionMapping } from "./suppression-mapping.js";

test("SuppressionMappingView shows the status in capitals", () => {
  const item = newSuppressionMapping("code-280", "label-26");
  const view = toSuppressionMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionMappingViews([item, item]).length, 2, "views");
});
