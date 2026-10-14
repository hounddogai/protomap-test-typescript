import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostMilestoneReport } from "./post-milestone-report.js";
import { PostMilestone, newPostMilestone } from "./post-milestone.js";

test("PostMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_066_416);
  const items: PostMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPostMilestone(`post-milestone-${index}`, "sample"));
  }
  const report = buildPostMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
