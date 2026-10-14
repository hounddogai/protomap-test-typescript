import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredPlacementExceptionReport } from "./tiered-placement-exception-report.js";
import { TieredPlacementException, newTieredPlacementException } from "./tiered-placement-exception.js";

test("TieredPlacementExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_252_312);
  const items: TieredPlacementException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredPlacementException(`tiered-placement-exception-${index}`, "sample"));
  }
  const report = buildTieredPlacementExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
