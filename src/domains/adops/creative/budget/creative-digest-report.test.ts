import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeDigestReport } from "./creative-digest-report.js";
import { CreativeDigest, newCreativeDigest } from "./creative-digest.js";

test("CreativeDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_744_577);
  const items: CreativeDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreativeDigest(`creative-digest-${index}`, "sample"));
  }
  const report = buildCreativeDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
