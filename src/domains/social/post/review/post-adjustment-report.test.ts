import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostAdjustmentReport } from "./post-adjustment-report.js";
import { PostAdjustment, newPostAdjustment } from "./post-adjustment.js";

test("PostAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_085_139);
  const items: PostAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPostAdjustment(`post-adjustment-${index}`, "sample"));
  }
  const report = buildPostAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
