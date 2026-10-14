import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeDigestReport } from "./nudge-digest-report.js";
import { NudgeDigest, newNudgeDigest } from "./nudge-digest.js";

test("NudgeDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_601_451);
  const items: NudgeDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newNudgeDigest(`nudge-digest-${index}`, "sample"));
  }
  const report = buildNudgeDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
