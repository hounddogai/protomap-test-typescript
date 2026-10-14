import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackReputationReservationReport } from "./fallback-reputation-reservation-report.js";
import {
  FallbackReputationReservation,
  newFallbackReputationReservation,
} from "./fallback-reputation-reservation.js";

test("FallbackReputationReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_769_138);
  const items: FallbackReputationReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackReputationReservation(`fallback-reputation-reservation-${index}`, "sample"));
  }
  const report = buildFallbackReputationReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
