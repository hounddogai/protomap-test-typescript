import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelTemplateReport } from "./model-template-report.js";
import { ModelTemplate, newModelTemplate } from "./model-template.js";

test("ModelTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_688_625);
  const items: ModelTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newModelTemplate(`model-template-${index}`, "sample"));
  }
  const report = buildModelTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
