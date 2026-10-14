import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedTicketViewDigestReport } from "./weighted-ticket-view-digest-report.js";
import { WeightedTicketViewDigest, newWeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

test("WeightedTicketViewDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_326_796);
  const items: WeightedTicketViewDigest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedTicketViewDigest(`weighted-ticket-view-digest-${index}`, "sample"));
  }
  const report = buildWeightedTicketViewDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
