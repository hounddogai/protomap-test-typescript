import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionReservationReport } from "./redemption-reservation-report.js";
import { RedemptionReservation, newRedemptionReservation } from "./redemption-reservation.js";

test("RedemptionReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_183_827);
  const items: RedemptionReservation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRedemptionReservation(`redemption-reservation-${index}`, "sample"));
  }
  const report = buildRedemptionReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
