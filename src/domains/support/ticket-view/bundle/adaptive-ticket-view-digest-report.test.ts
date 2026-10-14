import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveTicketViewDigestReport } from "./adaptive-ticket-view-digest-report.js";
import { AdaptiveTicketViewDigest, newAdaptiveTicketViewDigest } from "./adaptive-ticket-view-digest.js";

test("AdaptiveTicketViewDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_238_373);
  const items: AdaptiveTicketViewDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveTicketViewDigest(`adaptive-ticket-view-digest-${index}`, "sample"));
  }
  const report = buildAdaptiveTicketViewDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
