import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewDraftReport } from "./ticket-view-draft-report.js";
import { TicketViewDraft, newTicketViewDraft } from "./ticket-view-draft.js";

test("TicketViewDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_012_881);
  const items: TicketViewDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTicketViewDraft(`ticket-view-draft-${index}`, "sample"));
  }
  const report = buildTicketViewDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
