import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeQuotaReport } from "./creative-quota-report.js";
import { CreativeQuota, newCreativeQuota } from "./creative-quota.js";

test("CreativeQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_346_966);
  const items: CreativeQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreativeQuota(`creative-quota-${index}`, "sample"));
  }
  const report = buildCreativeQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
