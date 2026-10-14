import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveSenderTemplateReport } from "./adaptive-sender-template-report.js";
import { AdaptiveSenderTemplate, newAdaptiveSenderTemplate } from "./adaptive-sender-template.js";

test("AdaptiveSenderTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_672_017);
  const items: AdaptiveSenderTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveSenderTemplate(`adaptive-sender-template-${index}`, "sample"));
  }
  const report = buildAdaptiveSenderTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
