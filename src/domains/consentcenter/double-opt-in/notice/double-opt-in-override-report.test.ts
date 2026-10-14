import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInOverrideReport } from "./double-opt-in-override-report.js";
import { DoubleOptInOverride, newDoubleOptInOverride } from "./double-opt-in-override.js";

test("DoubleOptInOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_830_956);
  const items: DoubleOptInOverride[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDoubleOptInOverride(`double-opt-in-override-${index}`, "sample"));
  }
  const report = buildDoubleOptInOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
