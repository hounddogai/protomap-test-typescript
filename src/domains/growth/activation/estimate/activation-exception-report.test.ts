import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationExceptionReport } from "./activation-exception-report.js";
import { ActivationException, newActivationException } from "./activation-exception.js";

test("ActivationExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_968_592);
  const items: ActivationException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newActivationException(`activation-exception-${index}`, "sample"));
  }
  const report = buildActivationExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
