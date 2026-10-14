import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPacingTemplateReport } from "./lenient-pacing-template-report.js";
import { LenientPacingTemplate, newLenientPacingTemplate } from "./lenient-pacing-template.js";

test("LenientPacingTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_050_150);
  const items: LenientPacingTemplate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientPacingTemplate(`lenient-pacing-template-${index}`, "sample"));
  }
  const report = buildLenientPacingTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
