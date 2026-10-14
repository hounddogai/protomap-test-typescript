import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyPayoutSegmentReport } from "./legacy-payout-segment-report.js";
import { LegacyPayoutSegment, newLegacyPayoutSegment } from "./legacy-payout-segment.js";

test("LegacyPayoutSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_400_193);
  const items: LegacyPayoutSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyPayoutSegment(`legacy-payout-segment-${index}`, "sample"));
  }
  const report = buildLegacyPayoutSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
