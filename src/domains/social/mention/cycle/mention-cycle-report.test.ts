import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionCycleReport } from "./mention-cycle-report.js";
import { MentionCycle, newMentionCycle } from "./mention-cycle.js";

test("MentionCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_656_657);
  const items: MentionCycle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newMentionCycle(`mention-cycle-${index}`, "sample"));
  }
  const report = buildMentionCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
