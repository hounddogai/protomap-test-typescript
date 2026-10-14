import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackPlacementGroupReport } from "./fallback-placement-group-report.js";
import { FallbackPlacementGroup, newFallbackPlacementGroup } from "./fallback-placement-group.js";

test("FallbackPlacementGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_539_342);
  const items: FallbackPlacementGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackPlacementGroup(`fallback-placement-group-${index}`, "sample"));
  }
  const report = buildFallbackPlacementGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
