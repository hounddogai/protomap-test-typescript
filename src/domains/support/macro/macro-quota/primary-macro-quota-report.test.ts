import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryMacroQuotaReport } from "./primary-macro-quota-report.js";
import { PrimaryMacroQuota, newPrimaryMacroQuota } from "./primary-macro-quota.js";

test("PrimaryMacroQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_053_080);
  const items: PrimaryMacroQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryMacroQuota(`primary-macro-quota-${index}`, "sample"));
  }
  const report = buildPrimaryMacroQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
