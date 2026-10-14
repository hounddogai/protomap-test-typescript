import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSubscriptionReservationReport } from "./regional-subscription-reservation-report.js";
import {
  RegionalSubscriptionReservation,
  newRegionalSubscriptionReservation,
} from "./regional-subscription-reservation.js";

test("RegionalSubscriptionReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_269_901);
  const items: RegionalSubscriptionReservation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalSubscriptionReservation(`regional-subscription-reservation-${index}`, "sample"));
  }
  const report = buildRegionalSubscriptionReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
