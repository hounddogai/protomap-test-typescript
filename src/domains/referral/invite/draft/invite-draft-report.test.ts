import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteDraftReport } from "./invite-draft-report.js";
import { InviteDraft, newInviteDraft } from "./invite-draft.js";

test("InviteDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_606_093);
  const items: InviteDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newInviteDraft(`invite-draft-${index}`, "sample"));
  }
  const report = buildInviteDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
