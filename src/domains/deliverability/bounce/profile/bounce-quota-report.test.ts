import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceQuotaReport } from "./bounce-quota-report.js";
import { BounceQuota, newBounceQuota } from "./bounce-quota.js";

test("BounceQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_293_918);
  const items: BounceQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBounceQuota(`bounce-quota-${index}`, "sample"));
  }
  const report = buildBounceQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
