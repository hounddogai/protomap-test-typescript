import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictStreakNoticeReport } from "./strict-streak-notice-report.js";
import { StrictStreakNotice, newStrictStreakNotice } from "./strict-streak-notice.js";

test("StrictStreakNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_562_737);
  const items: StrictStreakNotice[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictStreakNotice(`strict-streak-notice-${index}`, "sample"));
  }
  const report = buildStrictStreakNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
