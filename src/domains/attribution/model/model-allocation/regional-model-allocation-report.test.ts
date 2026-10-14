import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalModelAllocationReport } from "./regional-model-allocation-report.js";
import { RegionalModelAllocation, newRegionalModelAllocation } from "./regional-model-allocation.js";

test("RegionalModelAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_478_354);
  const items: RegionalModelAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalModelAllocation(`regional-model-allocation-${index}`, "sample"));
  }
  const report = buildRegionalModelAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
