import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultMentionMappingReport } from "./default-mention-mapping-report.js";
import { DefaultMentionMapping, newDefaultMentionMapping } from "./default-mention-mapping.js";

test("DefaultMentionMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_259_218);
  const items: DefaultMentionMapping[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultMentionMapping(`default-mention-mapping-${index}`, "sample"));
  }
  const report = buildDefaultMentionMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
