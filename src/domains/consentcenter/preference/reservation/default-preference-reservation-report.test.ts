import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPreferenceReservationReport } from "./default-preference-reservation-report.js";
import { DefaultPreferenceReservation, newDefaultPreferenceReservation } from "./default-preference-reservation.js";

test("DefaultPreferenceReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_667_015);
  const items: DefaultPreferenceReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultPreferenceReservation(`default-preference-reservation-${index}`, "sample"));
  }
  const report = buildDefaultPreferenceReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
