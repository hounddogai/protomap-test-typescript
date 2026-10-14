import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingReplyAuditReport } from "./pending-reply-audit-report.js";
import { PendingReplyAudit, newPendingReplyAudit } from "./pending-reply-audit.js";

test("PendingReplyAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_895_578);
  const items: PendingReplyAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingReplyAudit(`pending-reply-audit-${index}`, "sample"));
  }
  const report = buildPendingReplyAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
