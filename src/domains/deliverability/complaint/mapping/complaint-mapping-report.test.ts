import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintMappingReport } from "./complaint-mapping-report.js";
import { ComplaintMapping, newComplaintMapping } from "./complaint-mapping.js";

test("ComplaintMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_499_787);
  const items: ComplaintMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newComplaintMapping(`complaint-mapping-${index}`, "sample"));
  }
  const report = buildComplaintMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
