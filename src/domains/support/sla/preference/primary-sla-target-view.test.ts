import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySlaTargetView, toPrimarySlaTargetViews } from "./primary-sla-target-view.js";
import { newPrimarySlaTarget } from "./primary-sla-target.js";

test("PrimarySlaTargetView shows the status in capitals", () => {
  const item = newPrimarySlaTarget("code-535", "title-510");
  const view = toPrimarySlaTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySlaTargetViews([item, item]).length, 2, "views");
});
