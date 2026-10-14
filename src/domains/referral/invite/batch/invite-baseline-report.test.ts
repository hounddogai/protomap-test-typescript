import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteBaselineReport } from "./invite-baseline-report.js";
import { InviteBaseline, newInviteBaseline } from "./invite-baseline.js";

test("InviteBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_025_974);
  const items: InviteBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newInviteBaseline(`invite-baseline-${index}`, "sample"));
  }
  const report = buildInviteBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
