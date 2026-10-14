import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryComplaintMappingView, toPrimaryComplaintMappingViews } from "./primary-complaint-mapping-view.js";
import { newPrimaryComplaintMapping } from "./primary-complaint-mapping.js";

test("PrimaryComplaintMappingView shows the status in capitals", () => {
  const item = newPrimaryComplaintMapping("code-121", "name-880");
  const view = toPrimaryComplaintMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryComplaintMappingViews([item, item]).length, 2, "views");
});
