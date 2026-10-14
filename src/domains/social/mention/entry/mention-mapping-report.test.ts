import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionMappingReport } from "./mention-mapping-report.js";
import { MentionMapping, newMentionMapping } from "./mention-mapping.js";

test("MentionMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_792_695);
  const items: MentionMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newMentionMapping(`mention-mapping-${index}`, "sample"));
  }
  const report = buildMentionMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
