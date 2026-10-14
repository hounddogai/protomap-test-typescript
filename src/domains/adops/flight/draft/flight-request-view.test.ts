import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightRequestView, toFlightRequestViews } from "./flight-request-view.js";
import { newFlightRequest } from "./flight-request.js";

test("FlightRequestView shows the status in capitals", () => {
  const item = newFlightRequest("code-651", "name-206");
  const view = toFlightRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightRequestViews([item, item]).length, 2, "views");
});
