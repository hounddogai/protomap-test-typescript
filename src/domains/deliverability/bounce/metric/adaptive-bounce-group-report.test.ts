import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveBounceGroupReport } from "./adaptive-bounce-group-report.js";
import { AdaptiveBounceGroup, newAdaptiveBounceGroup } from "./adaptive-bounce-group.js";

test("AdaptiveBounceGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_147_161);
  const items: AdaptiveBounceGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveBounceGroup(`adaptive-bounce-group-${index}`, "sample"));
  }
  const report = buildAdaptiveBounceGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
