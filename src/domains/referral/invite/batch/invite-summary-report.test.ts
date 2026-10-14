import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteSummaryReport } from "./invite-summary-report.js";
import { InviteSummary, newInviteSummary } from "./invite-summary.js";

test("InviteSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_393_429);
  const items: InviteSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newInviteSummary(`invite-summary-${index}`, "sample"));
  }
  const report = buildInviteSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
