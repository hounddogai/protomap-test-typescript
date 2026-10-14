import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientWaitBaselineReport } from "./lenient-wait-baseline-report.js";
import { LenientWaitBaseline, newLenientWaitBaseline } from "./lenient-wait-baseline.js";

test("LenientWaitBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_592_698);
  const items: LenientWaitBaseline[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientWaitBaseline(`lenient-wait-baseline-${index}`, "sample"));
  }
  const report = buildLenientWaitBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
