import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalBadgeDigestReport } from "./regional-badge-digest-report.js";
import { RegionalBadgeDigest, newRegionalBadgeDigest } from "./regional-badge-digest.js";

test("RegionalBadgeDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_027_738);
  const items: RegionalBadgeDigest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalBadgeDigest(`regional-badge-digest-${index}`, "sample"));
  }
  const report = buildRegionalBadgeDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
