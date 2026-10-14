import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredReplyVarianceReport } from "./tiered-reply-variance-report.js";
import { TieredReplyVariance, newTieredReplyVariance } from "./tiered-reply-variance.js";

test("TieredReplyVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_159_319);
  const items: TieredReplyVariance[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredReplyVariance(`tiered-reply-variance-${index}`, "sample"));
  }
  const report = buildTieredReplyVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
