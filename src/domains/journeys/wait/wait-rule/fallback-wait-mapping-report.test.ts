import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackWaitMappingReport } from "./fallback-wait-mapping-report.js";
import { FallbackWaitMapping, newFallbackWaitMapping } from "./fallback-wait-mapping.js";

test("FallbackWaitMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_639_531);
  const items: FallbackWaitMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackWaitMapping(`fallback-wait-mapping-${index}`, "sample"));
  }
  const report = buildFallbackWaitMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
