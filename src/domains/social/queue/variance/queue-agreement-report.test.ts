import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueAgreementReport } from "./queue-agreement-report.js";
import { QueueAgreement, newQueueAgreement } from "./queue-agreement.js";

test("QueueAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_610_386);
  const items: QueueAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newQueueAgreement(`queue-agreement-${index}`, "sample"));
  }
  const report = buildQueueAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
