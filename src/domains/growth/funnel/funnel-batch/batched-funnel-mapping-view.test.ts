import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFunnelMappingView, toBatchedFunnelMappingViews } from "./batched-funnel-mapping-view.js";
import { newBatchedFunnelMapping } from "./batched-funnel-mapping.js";

test("BatchedFunnelMappingView shows the status in capitals", () => {
  const item = newBatchedFunnelMapping("code-814", "title-506");
  const view = toBatchedFunnelMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFunnelMappingViews([item, item]).length, 2, "views");
});
