import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultCohortTemplateReport } from "./default-cohort-template-report.js";
import { DefaultCohortTemplate, newDefaultCohortTemplate } from "./default-cohort-template.js";

test("DefaultCohortTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_740_616);
  const items: DefaultCohortTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultCohortTemplate(`default-cohort-template-${index}`, "sample"));
  }
  const report = buildDefaultCohortTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
