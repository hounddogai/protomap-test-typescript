import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultInsightExceptionReport } from "./default-insight-exception-report.js";
import { DefaultInsightException, newDefaultInsightException } from "./default-insight-exception.js";

test("DefaultInsightExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_442_346);
  const items: DefaultInsightException[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultInsightException(`default-insight-exception-${index}`, "sample"));
  }
  const report = buildDefaultInsightExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
