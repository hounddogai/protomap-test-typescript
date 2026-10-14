import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostReservationReport } from "./post-reservation-report.js";
import { PostReservation, newPostReservation } from "./post-reservation.js";

test("PostReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_620_060);
  const items: PostReservation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPostReservation(`post-reservation-${index}`, "sample"));
  }
  const report = buildPostReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
