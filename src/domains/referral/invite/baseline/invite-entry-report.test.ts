import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteEntryReport } from "./invite-entry-report.js";
import { InviteEntry, newInviteEntry } from "./invite-entry.js";

test("InviteEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_314_311);
  const items: InviteEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newInviteEntry(`invite-entry-${index}`, "sample"));
  }
  const report = buildInviteEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
