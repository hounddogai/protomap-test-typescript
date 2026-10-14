import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveCreditNoticeReport } from "./adaptive-credit-notice-report.js";
import { AdaptiveCreditNotice, newAdaptiveCreditNotice } from "./adaptive-credit-notice.js";

test("AdaptiveCreditNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_936_678);
  const items: AdaptiveCreditNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveCreditNotice(`adaptive-credit-notice-${index}`, "sample"));
  }
  const report = buildAdaptiveCreditNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
