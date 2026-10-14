import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredPathDigestReport } from "./tiered-path-digest-report.js";
import { TieredPathDigest, newTieredPathDigest } from "./tiered-path-digest.js";

test("TieredPathDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_694_778);
  const items: TieredPathDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredPathDigest(`tiered-path-digest-${index}`, "sample"));
  }
  const report = buildTieredPathDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
