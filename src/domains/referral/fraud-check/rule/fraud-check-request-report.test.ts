import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckRequestReport } from "./fraud-check-request-report.js";
import { FraudCheckRequest, newFraudCheckRequest } from "./fraud-check-request.js";

test("FraudCheckRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_271_823);
  const items: FraudCheckRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFraudCheckRequest(`fraud-check-request-${index}`, "sample"));
  }
  const report = buildFraudCheckRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
