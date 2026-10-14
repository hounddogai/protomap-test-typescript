import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainTemplateReport } from "./domain-template-report.js";
import { DomainTemplate, newDomainTemplate } from "./domain-template.js";

test("DomainTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_910_206);
  const items: DomainTemplate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDomainTemplate(`domain-template-${index}`, "sample"));
  }
  const report = buildDomainTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
