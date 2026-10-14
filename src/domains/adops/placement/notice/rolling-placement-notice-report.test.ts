import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPlacementNoticeReport } from "./rolling-placement-notice-report.js";
import { RollingPlacementNotice, newRollingPlacementNotice } from "./rolling-placement-notice.js";

test("RollingPlacementNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_478_056);
  const items: RollingPlacementNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingPlacementNotice(`rolling-placement-notice-${index}`, "sample"));
  }
  const report = buildRollingPlacementNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
