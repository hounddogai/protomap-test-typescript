import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelTemplateReport } from "./funnel-template-report.js";
import { FunnelTemplate, newFunnelTemplate } from "./funnel-template.js";

test("FunnelTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_266_396);
  const items: FunnelTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFunnelTemplate(`funnel-template-${index}`, "sample"));
  }
  const report = buildFunnelTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
