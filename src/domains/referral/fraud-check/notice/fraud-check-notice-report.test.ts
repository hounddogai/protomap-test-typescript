import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckNoticeReport } from "./fraud-check-notice-report.js";
import { FraudCheckNotice, newFraudCheckNotice } from "./fraud-check-notice.js";

test("FraudCheckNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_414_691);
  const items: FraudCheckNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFraudCheckNotice(`fraud-check-notice-${index}`, "sample"));
  }
  const report = buildFraudCheckNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
