import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteReservationReport } from "./invite-reservation-report.js";
import { InviteReservation, newInviteReservation } from "./invite-reservation.js";

test("InviteReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_645_812);
  const items: InviteReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newInviteReservation(`invite-reservation-${index}`, "sample"));
  }
  const report = buildInviteReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
