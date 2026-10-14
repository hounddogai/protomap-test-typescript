import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionPolicyReport } from "./conversion-policy-report.js";
import { ConversionPolicy, newConversionPolicy } from "./conversion-policy.js";

test("ConversionPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_487_370);
  const items: ConversionPolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newConversionPolicy(`conversion-policy-${index}`, "sample"));
  }
  const report = buildConversionPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
