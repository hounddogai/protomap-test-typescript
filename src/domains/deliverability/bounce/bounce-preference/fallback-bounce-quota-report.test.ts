import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackBounceQuotaReport } from "./fallback-bounce-quota-report.js";
import { FallbackBounceQuota, newFallbackBounceQuota } from "./fallback-bounce-quota.js";

test("FallbackBounceQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_827_080);
  const items: FallbackBounceQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackBounceQuota(`fallback-bounce-quota-${index}`, "sample"));
  }
  const report = buildFallbackBounceQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
