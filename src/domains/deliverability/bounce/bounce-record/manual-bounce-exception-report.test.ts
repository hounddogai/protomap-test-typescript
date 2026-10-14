import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBounceExceptionReport } from "./manual-bounce-exception-report.js";
import { ManualBounceException, newManualBounceException } from "./manual-bounce-exception.js";

test("ManualBounceExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_434_011);
  const items: ManualBounceException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualBounceException(`manual-bounce-exception-${index}`, "sample"));
  }
  const report = buildManualBounceExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
