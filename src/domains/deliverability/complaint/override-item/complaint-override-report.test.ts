import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintOverrideReport } from "./complaint-override-report.js";
import { ComplaintOverride, newComplaintOverride } from "./complaint-override.js";

test("ComplaintOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_986_129);
  const items: ComplaintOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newComplaintOverride(`complaint-override-${index}`, "sample"));
  }
  const report = buildComplaintOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
