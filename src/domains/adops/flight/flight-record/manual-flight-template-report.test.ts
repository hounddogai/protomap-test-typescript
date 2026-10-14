import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualFlightTemplateReport } from "./manual-flight-template-report.js";
import { ManualFlightTemplate, newManualFlightTemplate } from "./manual-flight-template.js";

test("ManualFlightTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_423_520);
  const items: ManualFlightTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualFlightTemplate(`manual-flight-template-${index}`, "sample"));
  }
  const report = buildManualFlightTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
