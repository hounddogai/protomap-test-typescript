import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientWarmupTemplateReport } from "./lenient-warmup-template-report.js";
import { LenientWarmupTemplate, newLenientWarmupTemplate } from "./lenient-warmup-template.js";

test("LenientWarmupTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_732_583);
  const items: LenientWarmupTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientWarmupTemplate(`lenient-warmup-template-${index}`, "sample"));
  }
  const report = buildLenientWarmupTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
