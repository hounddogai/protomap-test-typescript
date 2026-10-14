import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalBadgeTemplateReport } from "./global-badge-template-report.js";
import { GlobalBadgeTemplate, newGlobalBadgeTemplate } from "./global-badge-template.js";

test("GlobalBadgeTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_784_551);
  const items: GlobalBadgeTemplate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalBadgeTemplate(`global-badge-template-${index}`, "sample"));
  }
  const report = buildGlobalBadgeTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
