import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyRollupReport } from "./reply-rollup-report.js";
import { ReplyRollup, newReplyRollup } from "./reply-rollup.js";

test("ReplyRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_677_628);
  const items: ReplyRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newReplyRollup(`reply-rollup-${index}`, "sample"));
  }
  const report = buildReplyRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
