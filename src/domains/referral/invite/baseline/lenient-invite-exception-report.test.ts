import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientInviteExceptionReport } from "./lenient-invite-exception-report.js";
import { LenientInviteException, newLenientInviteException } from "./lenient-invite-exception.js";

test("LenientInviteExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_129_670);
  const items: LenientInviteException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientInviteException(`lenient-invite-exception-${index}`, "sample"));
  }
  const report = buildLenientInviteExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
