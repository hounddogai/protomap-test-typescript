import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredEscalationReservationReport } from "./tiered-escalation-reservation-report.js";
import { TieredEscalationReservation, newTieredEscalationReservation } from "./tiered-escalation-reservation.js";

test("TieredEscalationReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_081_715);
  const items: TieredEscalationReservation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredEscalationReservation(`tiered-escalation-reservation-${index}`, "sample"));
  }
  const report = buildTieredEscalationReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
