import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackPaywallReservationReport } from "./fallback-paywall-reservation-report.js";
import { FallbackPaywallReservation, newFallbackPaywallReservation } from "./fallback-paywall-reservation.js";

test("FallbackPaywallReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_270_971);
  const items: FallbackPaywallReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackPaywallReservation(`fallback-paywall-reservation-${index}`, "sample"));
  }
  const report = buildFallbackPaywallReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
