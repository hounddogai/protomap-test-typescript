import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaVarianceReport } from "./sla-variance-report.js";
import { SlaVariance, newSlaVariance } from "./sla-variance.js";

test("SlaVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_897_702);
  const items: SlaVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSlaVariance(`sla-variance-${index}`, "sample"));
  }
  const report = buildSlaVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
