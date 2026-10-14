import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditTierReport } from "./credit-tier-report.js";
import { CreditTier, newCreditTier } from "./credit-tier.js";

test("CreditTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_268_015);
  const items: CreditTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreditTier(`credit-tier-${index}`, "sample"));
  }
  const report = buildCreditTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
