import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientWaitMappingReport } from "./lenient-wait-mapping-report.js";
import { LenientWaitMapping, newLenientWaitMapping } from "./lenient-wait-mapping.js";

test("LenientWaitMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_667_372);
  const items: LenientWaitMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientWaitMapping(`lenient-wait-mapping-${index}`, "sample"));
  }
  const report = buildLenientWaitMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
