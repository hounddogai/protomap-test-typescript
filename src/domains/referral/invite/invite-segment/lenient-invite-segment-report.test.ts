import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientInviteSegmentReport } from "./lenient-invite-segment-report.js";
import { LenientInviteSegment, newLenientInviteSegment } from "./lenient-invite-segment.js";

test("LenientInviteSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_833_013);
  const items: LenientInviteSegment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientInviteSegment(`lenient-invite-segment-${index}`, "sample"));
  }
  const report = buildLenientInviteSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
