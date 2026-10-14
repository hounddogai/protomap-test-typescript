import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedSlaMappingView, toWeightedSlaMappingViews } from "./weighted-sla-mapping-view.js";
import { newWeightedSlaMapping } from "./weighted-sla-mapping.js";

test("WeightedSlaMappingView shows the status in capitals", () => {
  const item = newWeightedSlaMapping("code-731", "name-889");
  const view = toWeightedSlaMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedSlaMappingViews([item, item]).length, 2, "views");
});
