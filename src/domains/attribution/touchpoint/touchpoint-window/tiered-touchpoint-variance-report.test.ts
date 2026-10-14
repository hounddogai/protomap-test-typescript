import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredTouchpointVarianceReport } from "./tiered-touchpoint-variance-report.js";
import { TieredTouchpointVariance, newTieredTouchpointVariance } from "./tiered-touchpoint-variance.js";

test("TieredTouchpointVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_699_258);
  const items: TieredTouchpointVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTieredTouchpointVariance(`tiered-touchpoint-variance-${index}`, "sample"));
  }
  const report = buildTieredTouchpointVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
