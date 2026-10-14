import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakBundleReport } from "./streak-bundle-report.js";
import { StreakBundle, newStreakBundle } from "./streak-bundle.js";

test("StreakBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_225_533);
  const items: StreakBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStreakBundle(`streak-bundle-${index}`, "sample"));
  }
  const report = buildStreakBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
