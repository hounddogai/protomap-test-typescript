import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathRequestReport } from "./path-request-report.js";
import { PathRequest, newPathRequest } from "./path-request.js";

test("PathRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_999_925);
  const items: PathRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPathRequest(`path-request-${index}`, "sample"));
  }
  const report = buildPathRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
