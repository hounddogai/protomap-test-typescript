import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderMappingReport } from "./sender-mapping-report.js";
import { SenderMapping, newSenderMapping } from "./sender-mapping.js";

test("SenderMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_064_358);
  const items: SenderMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSenderMapping(`sender-mapping-${index}`, "sample"));
  }
  const report = buildSenderMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
