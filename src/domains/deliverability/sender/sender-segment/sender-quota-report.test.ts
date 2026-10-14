import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderQuotaReport } from "./sender-quota-report.js";
import { SenderQuota, newSenderQuota } from "./sender-quota.js";

test("SenderQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_196_997);
  const items: SenderQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSenderQuota(`sender-quota-${index}`, "sample"));
  }
  const report = buildSenderQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
