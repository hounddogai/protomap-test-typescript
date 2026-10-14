import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalReputationDigestReport } from "./seasonal-reputation-digest-report.js";
import { SeasonalReputationDigest, newSeasonalReputationDigest } from "./seasonal-reputation-digest.js";

test("SeasonalReputationDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_884_434);
  const items: SeasonalReputationDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalReputationDigest(`seasonal-reputation-digest-${index}`, "sample"));
  }
  const report = buildSeasonalReputationDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
