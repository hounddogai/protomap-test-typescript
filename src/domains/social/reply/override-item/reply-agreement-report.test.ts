import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyAgreementReport } from "./reply-agreement-report.js";
import { ReplyAgreement, newReplyAgreement } from "./reply-agreement.js";

test("ReplyAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_567_092);
  const items: ReplyAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newReplyAgreement(`reply-agreement-${index}`, "sample"));
  }
  const report = buildReplyAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
