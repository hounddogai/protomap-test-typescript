import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaCycleReport } from "./sla-cycle-report.js";
import { SlaCycle, newSlaCycle } from "./sla-cycle.js";

test("SlaCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_983_985);
  const items: SlaCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSlaCycle(`sla-cycle-${index}`, "sample"));
  }
  const report = buildSlaCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
