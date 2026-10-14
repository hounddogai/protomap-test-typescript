import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultBounceExceptionReport } from "./default-bounce-exception-report.js";
import { DefaultBounceException, newDefaultBounceException } from "./default-bounce-exception.js";

test("DefaultBounceExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_194_842);
  const items: DefaultBounceException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultBounceException(`default-bounce-exception-${index}`, "sample"));
  }
  const report = buildDefaultBounceExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
