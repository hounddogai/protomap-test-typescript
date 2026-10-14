import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditMappingReport } from "./credit-mapping-report.js";
import { CreditMapping, newCreditMapping } from "./credit-mapping.js";

test("CreditMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_154_563);
  const items: CreditMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCreditMapping(`credit-mapping-${index}`, "sample"));
  }
  const report = buildCreditMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
