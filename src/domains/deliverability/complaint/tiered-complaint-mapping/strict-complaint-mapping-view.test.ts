import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictComplaintMappingView, toStrictComplaintMappingViews } from "./strict-complaint-mapping-view.js";
import { newStrictComplaintMapping } from "./strict-complaint-mapping.js";

test("StrictComplaintMappingView shows the status in capitals", () => {
  const item = newStrictComplaintMapping("code-910", "name-268");
  const view = toStrictComplaintMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictComplaintMappingViews([item, item]).length, 2, "views");
});
