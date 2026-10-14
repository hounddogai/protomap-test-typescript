import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupExceptionReport } from "./warmup-exception-report.js";
import { WarmupException, newWarmupException } from "./warmup-exception.js";

test("WarmupExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_332_454);
  const items: WarmupException[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWarmupException(`warmup-exception-${index}`, "sample"));
  }
  const report = buildWarmupExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
