import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightReservationView, toInsightReservationViews } from "./insight-reservation-view.js";
import { newInsightReservation } from "./insight-reservation.js";

test("InsightReservationView shows the status in capitals", () => {
  const item = newInsightReservation("code-527", "title-866");
  const view = toInsightReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightReservationViews([item, item]).length, 2, "views");
});
