import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyBaselineReport } from "./reply-baseline-report.js";
import { ReplyBaseline, newReplyBaseline } from "./reply-baseline.js";

test("ReplyBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_678_435);
  const items: ReplyBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newReplyBaseline(`reply-baseline-${index}`, "sample"));
  }
  const report = buildReplyBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
