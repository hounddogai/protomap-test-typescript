import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedMentionVarianceReport } from "./capped-mention-variance-report.js";
import { CappedMentionVariance, newCappedMentionVariance } from "./capped-mention-variance.js";

test("CappedMentionVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_278_526);
  const items: CappedMentionVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedMentionVariance(`capped-mention-variance-${index}`, "sample"));
  }
  const report = buildCappedMentionVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
