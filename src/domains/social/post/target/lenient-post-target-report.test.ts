import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPostTargetReport } from "./lenient-post-target-report.js";
import { LenientPostTarget, newLenientPostTarget } from "./lenient-post-target.js";

test("LenientPostTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_099_490);
  const items: LenientPostTarget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientPostTarget(`lenient-post-target-${index}`, "sample"));
  }
  const report = buildLenientPostTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
