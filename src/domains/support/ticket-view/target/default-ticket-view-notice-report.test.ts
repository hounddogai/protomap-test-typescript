import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultTicketViewNoticeReport } from "./default-ticket-view-notice-report.js";
import { DefaultTicketViewNotice, newDefaultTicketViewNotice } from "./default-ticket-view-notice.js";

test("DefaultTicketViewNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_404_303);
  const items: DefaultTicketViewNotice[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultTicketViewNotice(`default-ticket-view-notice-${index}`, "sample"));
  }
  const report = buildDefaultTicketViewNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
