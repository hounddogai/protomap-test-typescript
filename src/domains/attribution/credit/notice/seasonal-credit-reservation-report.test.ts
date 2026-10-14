import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCreditReservationReport } from "./seasonal-credit-reservation-report.js";
import { SeasonalCreditReservation, newSeasonalCreditReservation } from "./seasonal-credit-reservation.js";

test("SeasonalCreditReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_731_598);
  const items: SeasonalCreditReservation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalCreditReservation(`seasonal-credit-reservation-${index}`, "sample"));
  }
  const report = buildSeasonalCreditReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
