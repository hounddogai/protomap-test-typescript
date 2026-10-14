import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictMacroRequestReport } from "./strict-macro-request-report.js";
import { StrictMacroRequest, newStrictMacroRequest } from "./strict-macro-request.js";

test("StrictMacroRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_148_392);
  const items: StrictMacroRequest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictMacroRequest(`strict-macro-request-${index}`, "sample"));
  }
  const report = buildStrictMacroRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
