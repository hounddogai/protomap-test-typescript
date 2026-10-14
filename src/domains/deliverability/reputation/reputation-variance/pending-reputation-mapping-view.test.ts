import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingReputationMappingView,
  toPendingReputationMappingViews,
} from "./pending-reputation-mapping-view.js";
import { newPendingReputationMapping } from "./pending-reputation-mapping.js";

test("PendingReputationMappingView shows the status in capitals", () => {
  const item = newPendingReputationMapping("code-990", "title-804");
  const view = toPendingReputationMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingReputationMappingViews([item, item]).length, 2, "views");
});
