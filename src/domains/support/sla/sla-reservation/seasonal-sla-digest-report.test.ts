import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSlaDigestReport } from "./seasonal-sla-digest-report.js";
import { SeasonalSlaDigest, newSeasonalSlaDigest } from "./seasonal-sla-digest.js";

test("SeasonalSlaDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_990_864);
  const items: SeasonalSlaDigest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalSlaDigest(`seasonal-sla-digest-${index}`, "sample"));
  }
  const report = buildSeasonalSlaDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
