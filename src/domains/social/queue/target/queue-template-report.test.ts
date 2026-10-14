import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueTemplateReport } from "./queue-template-report.js";
import { QueueTemplate, newQueueTemplate } from "./queue-template.js";

test("QueueTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_451_882);
  const items: QueueTemplate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newQueueTemplate(`queue-template-${index}`, "sample"));
  }
  const report = buildQueueTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
