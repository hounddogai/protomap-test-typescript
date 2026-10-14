import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledWarmupTemplateReport } from "./scheduled-warmup-template-report.js";
import { ScheduledWarmupTemplate, newScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

test("ScheduledWarmupTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_240_272);
  const items: ScheduledWarmupTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledWarmupTemplate(`scheduled-warmup-template-${index}`, "sample"));
  }
  const report = buildScheduledWarmupTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
