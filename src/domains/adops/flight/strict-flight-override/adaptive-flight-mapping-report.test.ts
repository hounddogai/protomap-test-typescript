import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveFlightMappingReport } from "./adaptive-flight-mapping-report.js";
import { AdaptiveFlightMapping, newAdaptiveFlightMapping } from "./adaptive-flight-mapping.js";

test("AdaptiveFlightMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_471_626);
  const items: AdaptiveFlightMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveFlightMapping(`adaptive-flight-mapping-${index}`, "sample"));
  }
  const report = buildAdaptiveFlightMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
