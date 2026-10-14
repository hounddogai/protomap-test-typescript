import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupAuditReport } from "./warmup-audit-report.js";
import { WarmupAudit, newWarmupAudit } from "./warmup-audit.js";

test("WarmupAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_865_679);
  const items: WarmupAudit[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWarmupAudit(`warmup-audit-${index}`, "sample"));
  }
  const report = buildWarmupAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
