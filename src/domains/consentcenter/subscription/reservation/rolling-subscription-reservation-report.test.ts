import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingSubscriptionReservationReport } from "./rolling-subscription-reservation-report.js";
import {
  RollingSubscriptionReservation,
  newRollingSubscriptionReservation,
} from "./rolling-subscription-reservation.js";

test("RollingSubscriptionReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_424_015);
  const items: RollingSubscriptionReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingSubscriptionReservation(`rolling-subscription-reservation-${index}`, "sample"));
  }
  const report = buildRollingSubscriptionReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
