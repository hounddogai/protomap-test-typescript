import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedStreakDigestReport } from "./capped-streak-digest-report.js";
import { CappedStreakDigest, newCappedStreakDigest } from "./capped-streak-digest.js";

test("CappedStreakDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_632_279);
  const items: CappedStreakDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedStreakDigest(`capped-streak-digest-${index}`, "sample"));
  }
  const report = buildCappedStreakDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
