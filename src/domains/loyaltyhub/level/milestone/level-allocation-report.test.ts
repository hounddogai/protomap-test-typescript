import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelAllocationReport } from "./level-allocation-report.js";
import { LevelAllocation, newLevelAllocation } from "./level-allocation.js";

test("LevelAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_351_971);
  const items: LevelAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLevelAllocation(`level-allocation-${index}`, "sample"));
  }
  const report = buildLevelAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
