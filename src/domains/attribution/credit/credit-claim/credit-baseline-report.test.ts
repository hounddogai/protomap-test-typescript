import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditBaselineReport } from "./credit-baseline-report.js";
import { CreditBaseline, newCreditBaseline } from "./credit-baseline.js";

test("CreditBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_005_125);
  const items: CreditBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCreditBaseline(`credit-baseline-${index}`, "sample"));
  }
  const report = buildCreditBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
