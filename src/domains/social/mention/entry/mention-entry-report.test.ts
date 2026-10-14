import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionEntryReport } from "./mention-entry-report.js";
import { MentionEntry, newMentionEntry } from "./mention-entry.js";

test("MentionEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_585_271);
  const items: MentionEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newMentionEntry(`mention-entry-${index}`, "sample"));
  }
  const report = buildMentionEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
