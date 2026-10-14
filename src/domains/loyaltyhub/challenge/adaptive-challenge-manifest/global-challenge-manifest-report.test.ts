import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalChallengeManifestReport } from "./global-challenge-manifest-report.js";
import { GlobalChallengeManifest, newGlobalChallengeManifest } from "./global-challenge-manifest.js";

test("GlobalChallengeManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_308_708);
  const items: GlobalChallengeManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalChallengeManifest(`global-challenge-manifest-${index}`, "sample"));
  }
  const report = buildGlobalChallengeManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
