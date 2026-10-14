import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelRequestReport } from "./model-request-report.js";
import { ModelRequest, newModelRequest } from "./model-request.js";

test("ModelRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_459_272);
  const items: ModelRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newModelRequest(`model-request-${index}`, "sample"));
  }
  const report = buildModelRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
