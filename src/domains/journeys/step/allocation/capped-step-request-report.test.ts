import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedStepRequestReport } from "./capped-step-request-report.js";
import { CappedStepRequest, newCappedStepRequest } from "./capped-step-request.js";

test("CappedStepRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_456_227);
  const items: CappedStepRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedStepRequest(`capped-step-request-${index}`, "sample"));
  }
  const report = buildCappedStepRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
