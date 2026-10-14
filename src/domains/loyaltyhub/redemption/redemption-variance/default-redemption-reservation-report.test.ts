import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultRedemptionReservationReport } from "./default-redemption-reservation-report.js";
import { DefaultRedemptionReservation, newDefaultRedemptionReservation } from "./default-redemption-reservation.js";

test("DefaultRedemptionReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_857_558);
  const items: DefaultRedemptionReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultRedemptionReservation(`default-redemption-reservation-${index}`, "sample"));
  }
  const report = buildDefaultRedemptionReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
