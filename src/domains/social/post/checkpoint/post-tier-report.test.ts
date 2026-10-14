import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostTierReport } from "./post-tier-report.js";
import { PostTier, newPostTier } from "./post-tier.js";

test("PostTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_511_882);
  const items: PostTier[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPostTier(`post-tier-${index}`, "sample"));
  }
  const report = buildPostTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
