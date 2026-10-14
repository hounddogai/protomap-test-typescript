import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalReplyAgreementReport } from "./regional-reply-agreement-report.js";
import { RegionalReplyAgreement, newRegionalReplyAgreement } from "./regional-reply-agreement.js";

test("RegionalReplyAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_873_241);
  const items: RegionalReplyAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalReplyAgreement(`regional-reply-agreement-${index}`, "sample"));
  }
  const report = buildRegionalReplyAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
