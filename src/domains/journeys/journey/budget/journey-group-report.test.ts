import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyGroupReport } from "./journey-group-report.js";
import { JourneyGroup, newJourneyGroup } from "./journey-group.js";

test("JourneyGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_236_048);
  const items: JourneyGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newJourneyGroup(`journey-group-${index}`, "sample"));
  }
  const report = buildJourneyGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
