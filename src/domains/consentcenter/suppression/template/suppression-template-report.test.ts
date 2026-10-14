import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionTemplateReport } from "./suppression-template-report.js";
import { SuppressionTemplate, newSuppressionTemplate } from "./suppression-template.js";

test("SuppressionTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_118_375);
  const items: SuppressionTemplate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSuppressionTemplate(`suppression-template-${index}`, "sample"));
  }
  const report = buildSuppressionTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
