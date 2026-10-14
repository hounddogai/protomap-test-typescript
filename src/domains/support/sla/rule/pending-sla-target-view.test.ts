import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingSlaTargetView, toPendingSlaTargetViews } from "./pending-sla-target-view.js";
import { newPendingSlaTarget } from "./pending-sla-target.js";

test("PendingSlaTargetView shows the status in capitals", () => {
  const item = newPendingSlaTarget("code-563", "label-937");
  const view = toPendingSlaTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSlaTargetViews([item, item]).length, 2, "views");
});
