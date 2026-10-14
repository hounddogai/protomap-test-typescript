import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInExceptionReport } from "./double-opt-in-exception-report.js";
import { DoubleOptInException, newDoubleOptInException } from "./double-opt-in-exception.js";

test("DoubleOptInExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_109_639);
  const items: DoubleOptInException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDoubleOptInException(`double-opt-in-exception-${index}`, "sample"));
  }
  const report = buildDoubleOptInExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
