import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationDigestReport } from "./reputation-digest-report.js";
import { ReputationDigest, newReputationDigest } from "./reputation-digest.js";

test("ReputationDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_919_221);
  const items: ReputationDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newReputationDigest(`reputation-digest-${index}`, "sample"));
  }
  const report = buildReputationDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
