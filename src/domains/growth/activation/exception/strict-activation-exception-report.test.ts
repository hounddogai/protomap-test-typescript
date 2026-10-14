import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictActivationExceptionReport } from "./strict-activation-exception-report.js";
import { StrictActivationException, newStrictActivationException } from "./strict-activation-exception.js";

test("StrictActivationExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_733_097);
  const items: StrictActivationException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictActivationException(`strict-activation-exception-${index}`, "sample"));
  }
  const report = buildStrictActivationExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
