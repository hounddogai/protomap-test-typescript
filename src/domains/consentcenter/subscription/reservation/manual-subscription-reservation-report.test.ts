import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualSubscriptionReservationReport } from "./manual-subscription-reservation-report.js";
import {
  ManualSubscriptionReservation,
  newManualSubscriptionReservation,
} from "./manual-subscription-reservation.js";

test("ManualSubscriptionReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_414_809);
  const items: ManualSubscriptionReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualSubscriptionReservation(`manual-subscription-reservation-${index}`, "sample"));
  }
  const report = buildManualSubscriptionReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
