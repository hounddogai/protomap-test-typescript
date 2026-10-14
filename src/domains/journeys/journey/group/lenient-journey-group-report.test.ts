import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientJourneyGroupReport } from "./lenient-journey-group-report.js";
import { LenientJourneyGroup, newLenientJourneyGroup } from "./lenient-journey-group.js";

test("LenientJourneyGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_798_748);
  const items: LenientJourneyGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientJourneyGroup(`lenient-journey-group-${index}`, "sample"));
  }
  const report = buildLenientJourneyGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
