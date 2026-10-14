import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionRequestReport } from "./deflection-request-report.js";
import { DeflectionRequest, newDeflectionRequest } from "./deflection-request.js";

test("DeflectionRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_481_194);
  const items: DeflectionRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDeflectionRequest(`deflection-request-${index}`, "sample"));
  }
  const report = buildDeflectionRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
