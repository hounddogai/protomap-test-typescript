import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalPlacementAllocationReport } from "./regional-placement-allocation-report.js";
import { RegionalPlacementAllocation, newRegionalPlacementAllocation } from "./regional-placement-allocation.js";

test("RegionalPlacementAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_946_710);
  const items: RegionalPlacementAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalPlacementAllocation(`regional-placement-allocation-${index}`, "sample"));
  }
  const report = buildRegionalPlacementAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
