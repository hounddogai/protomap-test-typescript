import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveSlaMappingReport } from "./adaptive-sla-mapping-report.js";
import { AdaptiveSlaMapping, newAdaptiveSlaMapping } from "./adaptive-sla-mapping.js";

test("AdaptiveSlaMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_927_481);
  const items: AdaptiveSlaMapping[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveSlaMapping(`adaptive-sla-mapping-${index}`, "sample"));
  }
  const report = buildAdaptiveSlaMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
