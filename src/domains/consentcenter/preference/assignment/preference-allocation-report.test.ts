import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceAllocationReport } from "./preference-allocation-report.js";
import { PreferenceAllocation, newPreferenceAllocation } from "./preference-allocation.js";

test("PreferenceAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_718_033);
  const items: PreferenceAllocation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPreferenceAllocation(`preference-allocation-${index}`, "sample"));
  }
  const report = buildPreferenceAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
