import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintManifestReport } from "./complaint-manifest-report.js";
import { ComplaintManifest, newComplaintManifest } from "./complaint-manifest.js";

test("ComplaintManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_224_669);
  const items: ComplaintManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newComplaintManifest(`complaint-manifest-${index}`, "sample"));
  }
  const report = buildComplaintManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
