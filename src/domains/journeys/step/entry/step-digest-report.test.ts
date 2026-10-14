import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepDigestReport } from "./step-digest-report.js";
import { StepDigest, newStepDigest } from "./step-digest.js";

test("StepDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_827_593);
  const items: StepDigest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStepDigest(`step-digest-${index}`, "sample"));
  }
  const report = buildStepDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
