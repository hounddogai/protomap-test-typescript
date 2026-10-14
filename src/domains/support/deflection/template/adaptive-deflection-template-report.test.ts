import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveDeflectionTemplateReport } from "./adaptive-deflection-template-report.js";
import { AdaptiveDeflectionTemplate, newAdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

test("AdaptiveDeflectionTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_735_819);
  const items: AdaptiveDeflectionTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveDeflectionTemplate(`adaptive-deflection-template-${index}`, "sample"));
  }
  const report = buildAdaptiveDeflectionTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
