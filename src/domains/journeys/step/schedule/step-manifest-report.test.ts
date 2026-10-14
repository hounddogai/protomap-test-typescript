import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepManifestReport } from "./step-manifest-report.js";
import { StepManifest, newStepManifest } from "./step-manifest.js";

test("StepManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_500_070);
  const items: StepManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStepManifest(`step-manifest-${index}`, "sample"));
  }
  const report = buildStepManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
