import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelQuotaReport } from "./funnel-quota-report.js";
import { FunnelQuota, newFunnelQuota } from "./funnel-quota.js";

test("FunnelQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_947_633);
  const items: FunnelQuota[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFunnelQuota(`funnel-quota-${index}`, "sample"));
  }
  const report = buildFunnelQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
