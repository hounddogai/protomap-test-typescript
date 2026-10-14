import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakGroupReport } from "./streak-group-report.js";
import { StreakGroup, newStreakGroup } from "./streak-group.js";

test("StreakGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_007_489);
  const items: StreakGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStreakGroup(`streak-group-${index}`, "sample"));
  }
  const report = buildStreakGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
