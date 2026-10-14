import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredFunnelMappingView, toTieredFunnelMappingViews } from "./tiered-funnel-mapping-view.js";
import { newTieredFunnelMapping } from "./tiered-funnel-mapping.js";

test("TieredFunnelMappingView shows the status in capitals", () => {
  const item = newTieredFunnelMapping("code-397", "name-951");
  const view = toTieredFunnelMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredFunnelMappingViews([item, item]).length, 2, "views");
});
