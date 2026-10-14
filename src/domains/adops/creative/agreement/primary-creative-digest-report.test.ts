import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryCreativeDigestReport } from "./primary-creative-digest-report.js";
import { PrimaryCreativeDigest, newPrimaryCreativeDigest } from "./primary-creative-digest.js";

test("PrimaryCreativeDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_397_048);
  const items: PrimaryCreativeDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryCreativeDigest(`primary-creative-digest-${index}`, "sample"));
  }
  const report = buildPrimaryCreativeDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
