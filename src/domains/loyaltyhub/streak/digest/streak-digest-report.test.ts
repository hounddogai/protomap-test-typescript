import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakDigestReport } from "./streak-digest-report.js";
import { StreakDigest, newStreakDigest } from "./streak-digest.js";

test("StreakDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_353_489);
  const items: StreakDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStreakDigest(`streak-digest-${index}`, "sample"));
  }
  const report = buildStreakDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
