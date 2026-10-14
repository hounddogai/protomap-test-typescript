import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledPayoutReservationReport } from "./scheduled-payout-reservation-report.js";
import { ScheduledPayoutReservation, newScheduledPayoutReservation } from "./scheduled-payout-reservation.js";

test("ScheduledPayoutReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_169_578);
  const items: ScheduledPayoutReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledPayoutReservation(`scheduled-payout-reservation-${index}`, "sample"));
  }
  const report = buildScheduledPayoutReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
