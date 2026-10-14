import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackTierNoticeReport } from "./fallback-tier-notice-report.js";
import { FallbackTierNotice, newFallbackTierNotice } from "./fallback-tier-notice.js";

test("FallbackTierNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_723_381);
  const items: FallbackTierNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackTierNotice(`fallback-tier-notice-${index}`, "sample"));
  }
  const report = buildFallbackTierNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
