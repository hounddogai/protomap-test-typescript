import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalRewardEntryReport } from "./seasonal-reward-entry-report.js";
import { SeasonalRewardEntry, newSeasonalRewardEntry } from "./seasonal-reward-entry.js";

test("SeasonalRewardEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_219_636);
  const items: SeasonalRewardEntry[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalRewardEntry(`seasonal-reward-entry-${index}`, "sample"));
  }
  const report = buildSeasonalRewardEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
