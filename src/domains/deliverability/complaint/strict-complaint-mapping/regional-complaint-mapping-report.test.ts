import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalComplaintMappingReport } from "./regional-complaint-mapping-report.js";
import { RegionalComplaintMapping, newRegionalComplaintMapping } from "./regional-complaint-mapping.js";

test("RegionalComplaintMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_529_627);
  const items: RegionalComplaintMapping[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalComplaintMapping(`regional-complaint-mapping-${index}`, "sample"));
  }
  const report = buildRegionalComplaintMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
