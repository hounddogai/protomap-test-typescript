import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultInsightAuditReport } from "./default-insight-audit-report.js";
import { DefaultInsightAudit, newDefaultInsightAudit } from "./default-insight-audit.js";

test("DefaultInsightAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_798_211);
  const items: DefaultInsightAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultInsightAudit(`default-insight-audit-${index}`, "sample"));
  }
  const report = buildDefaultInsightAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
