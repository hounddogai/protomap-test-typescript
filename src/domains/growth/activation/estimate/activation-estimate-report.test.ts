import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationEstimateReport } from "./activation-estimate-report.js";
import { ActivationEstimate, newActivationEstimate } from "./activation-estimate.js";

test("ActivationEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_064_601);
  const items: ActivationEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newActivationEstimate(`activation-estimate-${index}`, "sample"));
  }
  const report = buildActivationEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
