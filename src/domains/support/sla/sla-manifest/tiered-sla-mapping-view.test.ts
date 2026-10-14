import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredSlaMappingView, toTieredSlaMappingViews } from "./tiered-sla-mapping-view.js";
import { newTieredSlaMapping } from "./tiered-sla-mapping.js";

test("TieredSlaMappingView shows the status in capitals", () => {
  const item = newTieredSlaMapping("code-241", "title-966");
  const view = toTieredSlaMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSlaMappingViews([item, item]).length, 2, "views");
});
