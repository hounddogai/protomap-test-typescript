import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalFlightEstimateReport } from "./global-flight-estimate-report.js";
import { GlobalFlightEstimate, newGlobalFlightEstimate } from "./global-flight-estimate.js";

test("GlobalFlightEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_891_256);
  const items: GlobalFlightEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalFlightEstimate(`global-flight-estimate-${index}`, "sample"));
  }
  const report = buildGlobalFlightEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
