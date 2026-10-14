import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedDomainMappingReport } from "./capped-domain-mapping-report.js";
import { CappedDomainMapping, newCappedDomainMapping } from "./capped-domain-mapping.js";

test("CappedDomainMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_287_080);
  const items: CappedDomainMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedDomainMapping(`capped-domain-mapping-${index}`, "sample"));
  }
  const report = buildCappedDomainMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
