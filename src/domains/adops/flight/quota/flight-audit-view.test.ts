import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightAuditView, toFlightAuditViews } from "./flight-audit-view.js";
import { newFlightAudit } from "./flight-audit.js";

test("FlightAuditView shows the status in capitals", () => {
  const item = newFlightAudit("code-85", "label-295");
  const view = toFlightAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightAuditViews([item, item]).length, 2, "views");
});
