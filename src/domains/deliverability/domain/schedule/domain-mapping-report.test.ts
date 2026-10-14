import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainMappingReport } from "./domain-mapping-report.js";
import { DomainMapping, newDomainMapping } from "./domain-mapping.js";

test("DomainMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_289_165);
  const items: DomainMapping[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDomainMapping(`domain-mapping-${index}`, "sample"));
  }
  const report = buildDomainMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
