import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictDoubleOptInExceptionReport } from "./strict-double-opt-in-exception-report.js";
import { StrictDoubleOptInException, newStrictDoubleOptInException } from "./strict-double-opt-in-exception.js";

test("StrictDoubleOptInExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_614_526);
  const items: StrictDoubleOptInException[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictDoubleOptInException(`strict-double-opt-in-exception-${index}`, "sample"));
  }
  const report = buildStrictDoubleOptInExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
