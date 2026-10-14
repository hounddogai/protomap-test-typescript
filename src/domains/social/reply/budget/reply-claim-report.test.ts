import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyClaimReport } from "./reply-claim-report.js";
import { ReplyClaim, newReplyClaim } from "./reply-claim.js";

test("ReplyClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_273_999);
  const items: ReplyClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newReplyClaim(`reply-claim-${index}`, "sample"));
  }
  const report = buildReplyClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
