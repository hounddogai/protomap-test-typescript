import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionAdjustmentReport } from "./mention-adjustment-report.js";
import { MentionAdjustment, newMentionAdjustment } from "./mention-adjustment.js";

test("MentionAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_014_608);
  const items: MentionAdjustment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newMentionAdjustment(`mention-adjustment-${index}`, "sample"));
  }
  const report = buildMentionAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
