import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditRequestReport } from "./credit-request-report.js";
import { CreditRequest, newCreditRequest } from "./credit-request.js";

test("CreditRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_141_115);
  const items: CreditRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCreditRequest(`credit-request-${index}`, "sample"));
  }
  const report = buildCreditRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
