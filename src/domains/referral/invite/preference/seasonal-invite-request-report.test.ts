import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalInviteRequestReport } from "./seasonal-invite-request-report.js";
import { SeasonalInviteRequest, newSeasonalInviteRequest } from "./seasonal-invite-request.js";

test("SeasonalInviteRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_054_377);
  const items: SeasonalInviteRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalInviteRequest(`seasonal-invite-request-${index}`, "sample"));
  }
  const report = buildSeasonalInviteRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
