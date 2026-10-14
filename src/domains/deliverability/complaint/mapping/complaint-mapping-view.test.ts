import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintMappingView, toComplaintMappingViews } from "./complaint-mapping-view.js";
import { newComplaintMapping } from "./complaint-mapping.js";

test("ComplaintMappingView shows the status in capitals", () => {
  const item = newComplaintMapping("code-566", "name-305");
  const view = toComplaintMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintMappingViews([item, item]).length, 2, "views");
});
