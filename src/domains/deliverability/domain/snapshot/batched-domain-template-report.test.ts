import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedDomainTemplateReport } from "./batched-domain-template-report.js";
import { BatchedDomainTemplate, newBatchedDomainTemplate } from "./batched-domain-template.js";

test("BatchedDomainTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_831_380);
  const items: BatchedDomainTemplate[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedDomainTemplate(`batched-domain-template-${index}`, "sample"));
  }
  const report = buildBatchedDomainTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
