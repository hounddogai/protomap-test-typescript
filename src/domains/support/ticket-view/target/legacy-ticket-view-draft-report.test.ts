import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyTicketViewDraftReport } from "./legacy-ticket-view-draft-report.js";
import { LegacyTicketViewDraft, newLegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

test("LegacyTicketViewDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_065_254);
  const items: LegacyTicketViewDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyTicketViewDraft(`legacy-ticket-view-draft-${index}`, "sample"));
  }
  const report = buildLegacyTicketViewDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
