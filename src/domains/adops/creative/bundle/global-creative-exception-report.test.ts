import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalCreativeExceptionReport } from "./global-creative-exception-report.js";
import { GlobalCreativeException, newGlobalCreativeException } from "./global-creative-exception.js";

test("GlobalCreativeExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_788_449);
  const items: GlobalCreativeException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalCreativeException(`global-creative-exception-${index}`, "sample"));
  }
  const report = buildGlobalCreativeExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
