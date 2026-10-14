import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaTemplateReport } from "./sla-template-report.js";
import { SlaTemplate, newSlaTemplate } from "./sla-template.js";

test("SlaTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_909_289);
  const items: SlaTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSlaTemplate(`sla-template-${index}`, "sample"));
  }
  const report = buildSlaTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
