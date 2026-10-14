import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedFlightBaselineReport } from "./capped-flight-baseline-report.js";
import { CappedFlightBaseline, newCappedFlightBaseline } from "./capped-flight-baseline.js";

test("CappedFlightBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_258_550);
  const items: CappedFlightBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedFlightBaseline(`capped-flight-baseline-${index}`, "sample"));
  }
  const report = buildCappedFlightBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
