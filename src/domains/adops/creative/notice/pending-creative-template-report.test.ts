import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCreativeTemplateReport } from "./pending-creative-template-report.js";
import { PendingCreativeTemplate, newPendingCreativeTemplate } from "./pending-creative-template.js";

test("PendingCreativeTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_346_731);
  const items: PendingCreativeTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingCreativeTemplate(`pending-creative-template-${index}`, "sample"));
  }
  const report = buildPendingCreativeTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
