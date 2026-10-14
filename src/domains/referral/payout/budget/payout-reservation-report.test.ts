import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutReservationReport } from "./payout-reservation-report.js";
import { PayoutReservation, newPayoutReservation } from "./payout-reservation.js";

test("PayoutReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_210_264);
  const items: PayoutReservation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPayoutReservation(`payout-reservation-${index}`, "sample"));
  }
  const report = buildPayoutReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
