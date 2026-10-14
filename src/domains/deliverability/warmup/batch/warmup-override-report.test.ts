import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupOverrideReport } from "./warmup-override-report.js";
import { WarmupOverride, newWarmupOverride } from "./warmup-override.js";

test("WarmupOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_226_539);
  const items: WarmupOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWarmupOverride(`warmup-override-${index}`, "sample"));
  }
  const report = buildWarmupOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
