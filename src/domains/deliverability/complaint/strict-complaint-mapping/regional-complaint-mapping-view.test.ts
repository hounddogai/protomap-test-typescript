import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalComplaintMappingView,
  toRegionalComplaintMappingViews,
} from "./regional-complaint-mapping-view.js";
import { newRegionalComplaintMapping } from "./regional-complaint-mapping.js";

test("RegionalComplaintMappingView shows the status in capitals", () => {
  const item = newRegionalComplaintMapping("code-118", "name-475");
  const view = toRegionalComplaintMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalComplaintMappingViews([item, item]).length, 2, "views");
});
