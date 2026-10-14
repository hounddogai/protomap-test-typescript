import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredTouchpointOverrideReport } from "./tiered-touchpoint-override-report.js";
import { TieredTouchpointOverride, newTieredTouchpointOverride } from "./tiered-touchpoint-override.js";

test("TieredTouchpointOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_910_679);
  const items: TieredTouchpointOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredTouchpointOverride(`tiered-touchpoint-override-${index}`, "sample"));
  }
  const report = buildTieredTouchpointOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
