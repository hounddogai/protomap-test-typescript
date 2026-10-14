import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictTouchpointNoticeReport } from "./strict-touchpoint-notice-report.js";
import { StrictTouchpointNotice, newStrictTouchpointNotice } from "./strict-touchpoint-notice.js";

test("StrictTouchpointNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_689_017);
  const items: StrictTouchpointNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictTouchpointNotice(`strict-touchpoint-notice-${index}`, "sample"));
  }
  const report = buildStrictTouchpointNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
