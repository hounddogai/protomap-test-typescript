import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackSenderReservationReport } from "./fallback-sender-reservation-report.js";
import { FallbackSenderReservation, newFallbackSenderReservation } from "./fallback-sender-reservation.js";

test("FallbackSenderReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_600_810);
  const items: FallbackSenderReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackSenderReservation(`fallback-sender-reservation-${index}`, "sample"));
  }
  const report = buildFallbackSenderReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
