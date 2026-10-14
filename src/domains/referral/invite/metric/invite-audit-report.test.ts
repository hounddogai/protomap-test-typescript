import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteAuditReport } from "./invite-audit-report.js";
import { InviteAudit, newInviteAudit } from "./invite-audit.js";

test("InviteAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_124_784);
  const items: InviteAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newInviteAudit(`invite-audit-${index}`, "sample"));
  }
  const report = buildInviteAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
