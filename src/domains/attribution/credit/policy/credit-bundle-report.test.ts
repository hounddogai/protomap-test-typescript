import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditBundleReport } from "./credit-bundle-report.js";
import { CreditBundle, newCreditBundle } from "./credit-bundle.js";

test("CreditBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_733_472);
  const items: CreditBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreditBundle(`credit-bundle-${index}`, "sample"));
  }
  const report = buildCreditBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
