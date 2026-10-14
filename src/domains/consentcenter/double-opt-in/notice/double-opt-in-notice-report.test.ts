import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInNoticeReport } from "./double-opt-in-notice-report.js";
import { DoubleOptInNotice, newDoubleOptInNotice } from "./double-opt-in-notice.js";

test("DoubleOptInNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_045_570);
  const items: DoubleOptInNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDoubleOptInNotice(`double-opt-in-notice-${index}`, "sample"));
  }
  const report = buildDoubleOptInNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
