import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientTierMappingView, toLenientTierMappingViews } from "./lenient-tier-mapping-view.js";
import { newLenientTierMapping } from "./lenient-tier-mapping.js";

test("LenientTierMappingView shows the status in capitals", () => {
  const item = newLenientTierMapping("code-134", "title-341");
  const view = toLenientTierMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientTierMappingViews([item, item]).length, 2, "views");
});
