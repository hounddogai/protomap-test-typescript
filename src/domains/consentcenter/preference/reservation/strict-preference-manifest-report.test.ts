import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPreferenceManifestReport } from "./strict-preference-manifest-report.js";
import { StrictPreferenceManifest, newStrictPreferenceManifest } from "./strict-preference-manifest.js";

test("StrictPreferenceManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_493_712);
  const items: StrictPreferenceManifest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictPreferenceManifest(`strict-preference-manifest-${index}`, "sample"));
  }
  const report = buildStrictPreferenceManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
