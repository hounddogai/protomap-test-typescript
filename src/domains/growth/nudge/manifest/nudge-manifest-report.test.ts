import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeManifestReport } from "./nudge-manifest-report.js";
import { NudgeManifest, newNudgeManifest } from "./nudge-manifest.js";

test("NudgeManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_461_961);
  const items: NudgeManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newNudgeManifest(`nudge-manifest-${index}`, "sample"));
  }
  const report = buildNudgeManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
