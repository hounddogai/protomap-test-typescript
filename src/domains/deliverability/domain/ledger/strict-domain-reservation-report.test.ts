import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictDomainReservationReport } from "./strict-domain-reservation-report.js";
import { StrictDomainReservation, newStrictDomainReservation } from "./strict-domain-reservation.js";

test("StrictDomainReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_655_466);
  const items: StrictDomainReservation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictDomainReservation(`strict-domain-reservation-${index}`, "sample"));
  }
  const report = buildStrictDomainReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
