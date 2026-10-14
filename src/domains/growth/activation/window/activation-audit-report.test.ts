import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationAuditReport } from "./activation-audit-report.js";
import { ActivationAudit, newActivationAudit } from "./activation-audit.js";

test("ActivationAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_222_697);
  const items: ActivationAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationAudit(`activation-audit-${index}`, "sample"));
  }
  const report = buildActivationAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
