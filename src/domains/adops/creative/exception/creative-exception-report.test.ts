import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeExceptionReport } from "./creative-exception-report.js";
import { CreativeException, newCreativeException } from "./creative-exception.js";

test("CreativeExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_222_068);
  const items: CreativeException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreativeException(`creative-exception-${index}`, "sample"));
  }
  const report = buildCreativeExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
