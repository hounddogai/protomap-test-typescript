import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyPolicyReport } from "./reply-policy-report.js";
import { ReplyPolicy, newReplyPolicy } from "./reply-policy.js";

test("ReplyPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_588_902);
  const items: ReplyPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newReplyPolicy(`reply-policy-${index}`, "sample"));
  }
  const report = buildReplyPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
