import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelThresholdReport } from "./model-threshold-report.js";
import { ModelThreshold, newModelThreshold } from "./model-threshold.js";

test("ModelThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_673_950);
  const items: ModelThreshold[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newModelThreshold(`model-threshold-${index}`, "sample"));
  }
  const report = buildModelThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
