import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentTemplateReport } from "./enrollment-template-report.js";
import { EnrollmentTemplate, newEnrollmentTemplate } from "./enrollment-template.js";

test("EnrollmentTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_794_900);
  const items: EnrollmentTemplate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newEnrollmentTemplate(`enrollment-template-${index}`, "sample"));
  }
  const report = buildEnrollmentTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
