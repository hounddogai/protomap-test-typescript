import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientFlightExceptionReport } from "./lenient-flight-exception-report.js";
import { LenientFlightException, newLenientFlightException } from "./lenient-flight-exception.js";

test("LenientFlightExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_847_843);
  const items: LenientFlightException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientFlightException(`lenient-flight-exception-${index}`, "sample"));
  }
  const report = buildLenientFlightExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
