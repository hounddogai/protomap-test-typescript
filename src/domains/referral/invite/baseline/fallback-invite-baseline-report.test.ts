import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackInviteBaselineReport } from "./fallback-invite-baseline-report.js";
import { FallbackInviteBaseline, newFallbackInviteBaseline } from "./fallback-invite-baseline.js";

test("FallbackInviteBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_608_898);
  const items: FallbackInviteBaseline[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackInviteBaseline(`fallback-invite-baseline-${index}`, "sample"));
  }
  const report = buildFallbackInviteBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
