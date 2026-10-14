import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultWarmupExceptionReport } from "./default-warmup-exception-report.js";
import { DefaultWarmupException, newDefaultWarmupException } from "./default-warmup-exception.js";

test("DefaultWarmupExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_336_720);
  const items: DefaultWarmupException[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultWarmupException(`default-warmup-exception-${index}`, "sample"));
  }
  const report = buildDefaultWarmupExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
