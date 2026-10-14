import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSenderMappingReport } from "./regional-sender-mapping-report.js";
import { RegionalSenderMapping, newRegionalSenderMapping } from "./regional-sender-mapping.js";

test("RegionalSenderMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_341_114);
  const items: RegionalSenderMapping[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalSenderMapping(`regional-sender-mapping-${index}`, "sample"));
  }
  const report = buildRegionalSenderMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
