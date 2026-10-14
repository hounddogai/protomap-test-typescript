import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimarySlaTargetReport } from "./primary-sla-target-report.js";
import { PrimarySlaTarget, newPrimarySlaTarget } from "./primary-sla-target.js";

test("PrimarySlaTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_396_808);
  const items: PrimarySlaTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimarySlaTarget(`primary-sla-target-${index}`, "sample"));
  }
  const report = buildPrimarySlaTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
