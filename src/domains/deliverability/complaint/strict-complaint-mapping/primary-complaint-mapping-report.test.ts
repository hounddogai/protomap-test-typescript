import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryComplaintMappingReport } from "./primary-complaint-mapping-report.js";
import { PrimaryComplaintMapping, newPrimaryComplaintMapping } from "./primary-complaint-mapping.js";

test("PrimaryComplaintMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_993_505);
  const items: PrimaryComplaintMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryComplaintMapping(`primary-complaint-mapping-${index}`, "sample"));
  }
  const report = buildPrimaryComplaintMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
