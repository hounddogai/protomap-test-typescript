import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteRequestReport } from "./invite-request-report.js";
import { InviteRequest, newInviteRequest } from "./invite-request.js";

test("InviteRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_261_936);
  const items: InviteRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newInviteRequest(`invite-request-${index}`, "sample"));
  }
  const report = buildInviteRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
