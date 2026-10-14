import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderTemplateReport } from "./sender-template-report.js";
import { SenderTemplate, newSenderTemplate } from "./sender-template.js";

test("SenderTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_949_967);
  const items: SenderTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSenderTemplate(`sender-template-${index}`, "sample"));
  }
  const report = buildSenderTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
