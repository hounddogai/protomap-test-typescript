import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelOverrideReport } from "./model-override-report.js";
import { ModelOverride, newModelOverride } from "./model-override.js";

test("ModelOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_429_081);
  const items: ModelOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newModelOverride(`model-override-${index}`, "sample"));
  }
  const report = buildModelOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
