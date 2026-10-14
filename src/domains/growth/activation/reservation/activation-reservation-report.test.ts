import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationReservationReport } from "./activation-reservation-report.js";
import { ActivationReservation, newActivationReservation } from "./activation-reservation.js";

test("ActivationReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_240_204);
  const items: ActivationReservation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationReservation(`activation-reservation-${index}`, "sample"));
  }
  const report = buildActivationReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
