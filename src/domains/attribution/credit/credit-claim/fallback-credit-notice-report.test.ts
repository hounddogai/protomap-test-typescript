import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackCreditNoticeReport } from "./fallback-credit-notice-report.js";
import { FallbackCreditNotice, newFallbackCreditNotice } from "./fallback-credit-notice.js";

test("FallbackCreditNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_098_328);
  const items: FallbackCreditNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackCreditNotice(`fallback-credit-notice-${index}`, "sample"));
  }
  const report = buildFallbackCreditNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
