import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualSuppressionTemplateReport } from "./manual-suppression-template-report.js";
import { ManualSuppressionTemplate, newManualSuppressionTemplate } from "./manual-suppression-template.js";

test("ManualSuppressionTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_037_319);
  const items: ManualSuppressionTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualSuppressionTemplate(`manual-suppression-template-${index}`, "sample"));
  }
  const report = buildManualSuppressionTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
