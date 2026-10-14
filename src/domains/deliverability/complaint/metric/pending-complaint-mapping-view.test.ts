import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingComplaintMappingView, toPendingComplaintMappingViews } from "./pending-complaint-mapping-view.js";
import { newPendingComplaintMapping } from "./pending-complaint-mapping.js";

test("PendingComplaintMappingView shows the status in capitals", () => {
  const item = newPendingComplaintMapping("code-629", "name-380");
  const view = toPendingComplaintMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingComplaintMappingViews([item, item]).length, 2, "views");
});
