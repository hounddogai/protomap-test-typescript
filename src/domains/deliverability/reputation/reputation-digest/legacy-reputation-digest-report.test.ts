import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyReputationDigestReport } from "./legacy-reputation-digest-report.js";
import { LegacyReputationDigest, newLegacyReputationDigest } from "./legacy-reputation-digest.js";

test("LegacyReputationDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_842_872);
  const items: LegacyReputationDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyReputationDigest(`legacy-reputation-digest-${index}`, "sample"));
  }
  const report = buildLegacyReputationDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
