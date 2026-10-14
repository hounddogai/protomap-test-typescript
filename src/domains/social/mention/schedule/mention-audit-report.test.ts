import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionAuditReport } from "./mention-audit-report.js";
import { MentionAudit, newMentionAudit } from "./mention-audit.js";

test("MentionAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_124_675);
  const items: MentionAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newMentionAudit(`mention-audit-${index}`, "sample"));
  }
  const report = buildMentionAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
