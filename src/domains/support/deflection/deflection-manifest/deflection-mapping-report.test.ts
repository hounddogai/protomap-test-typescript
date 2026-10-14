import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionMappingReport } from "./deflection-mapping-report.js";
import { DeflectionMapping, newDeflectionMapping } from "./deflection-mapping.js";

test("DeflectionMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_260_580);
  const items: DeflectionMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDeflectionMapping(`deflection-mapping-${index}`, "sample"));
  }
  const report = buildDeflectionMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
