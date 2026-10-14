import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackComplaintMappingView,
  toFallbackComplaintMappingViews,
} from "./fallback-complaint-mapping-view.js";
import { newFallbackComplaintMapping } from "./fallback-complaint-mapping.js";

test("FallbackComplaintMappingView shows the status in capitals", () => {
  const item = newFallbackComplaintMapping("code-537", "name-99");
  const view = toFallbackComplaintMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackComplaintMappingViews([item, item]).length, 2, "views");
});
