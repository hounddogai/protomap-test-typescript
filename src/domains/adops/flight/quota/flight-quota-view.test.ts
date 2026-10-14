import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightQuotaView, toFlightQuotaViews } from "./flight-quota-view.js";
import { newFlightQuota } from "./flight-quota.js";

test("FlightQuotaView shows the status in capitals", () => {
  const item = newFlightQuota("code-666", "name-342");
  const view = toFlightQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightQuotaViews([item, item]).length, 2, "views");
});
