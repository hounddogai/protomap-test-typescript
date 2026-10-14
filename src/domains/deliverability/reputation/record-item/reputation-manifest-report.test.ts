import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationManifestReport } from "./reputation-manifest-report.js";
import { ReputationManifest, newReputationManifest } from "./reputation-manifest.js";

test("ReputationManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_656_221);
  const items: ReputationManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newReputationManifest(`reputation-manifest-${index}`, "sample"));
  }
  const report = buildReputationManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
