import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledSenderAgreementReport } from "./scheduled-sender-agreement-report.js";
import { ScheduledSenderAgreement, newScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

test("ScheduledSenderAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_424_986);
  const items: ScheduledSenderAgreement[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledSenderAgreement(`scheduled-sender-agreement-${index}`, "sample"));
  }
  const report = buildScheduledSenderAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
