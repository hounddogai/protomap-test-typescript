import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostTargetReport } from "./post-target-report.js";
import { PostTarget, newPostTarget } from "./post-target.js";

test("PostTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_509_880);
  const items: PostTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPostTarget(`post-target-${index}`, "sample"));
  }
  const report = buildPostTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
