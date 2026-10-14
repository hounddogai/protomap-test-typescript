import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathQuotaReport } from "./path-quota-report.js";
import { PathQuota, newPathQuota } from "./path-quota.js";

test("PathQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_841_629);
  const items: PathQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPathQuota(`path-quota-${index}`, "sample"));
  }
  const report = buildPathQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
