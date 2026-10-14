import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBounceNoticeReport } from "./manual-bounce-notice-report.js";
import { ManualBounceNotice, newManualBounceNotice } from "./manual-bounce-notice.js";

test("ManualBounceNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_124_446);
  const items: ManualBounceNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualBounceNotice(`manual-bounce-notice-${index}`, "sample"));
  }
  const report = buildManualBounceNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
