import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeTemplateReport } from "./badge-template-report.js";
import { BadgeTemplate, newBadgeTemplate } from "./badge-template.js";

test("BadgeTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_678_245);
  const items: BadgeTemplate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBadgeTemplate(`badge-template-${index}`, "sample"));
  }
  const report = buildBadgeTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
