import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackBounceRollupReport } from "./fallback-bounce-rollup-report.js";
import { FallbackBounceRollup, newFallbackBounceRollup } from "./fallback-bounce-rollup.js";

test("FallbackBounceRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_933_407);
  const items: FallbackBounceRollup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackBounceRollup(`fallback-bounce-rollup-${index}`, "sample"));
  }
  const report = buildFallbackBounceRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
