import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryInviteEntryReport } from "./primary-invite-entry-report.js";
import { PrimaryInviteEntry, newPrimaryInviteEntry } from "./primary-invite-entry.js";

test("PrimaryInviteEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_309_624);
  const items: PrimaryInviteEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryInviteEntry(`primary-invite-entry-${index}`, "sample"));
  }
  const report = buildPrimaryInviteEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
