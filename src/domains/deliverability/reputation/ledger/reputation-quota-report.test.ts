import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationQuotaReport } from "./reputation-quota-report.js";
import { ReputationQuota, newReputationQuota } from "./reputation-quota.js";

test("ReputationQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_330_538);
  const items: ReputationQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newReputationQuota(`reputation-quota-${index}`, "sample"));
  }
  const report = buildReputationQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
