import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultInviteEntryReport } from "./default-invite-entry-report.js";
import { DefaultInviteEntry, newDefaultInviteEntry } from "./default-invite-entry.js";

test("DefaultInviteEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_250_654);
  const items: DefaultInviteEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultInviteEntry(`default-invite-entry-${index}`, "sample"));
  }
  const report = buildDefaultInviteEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
