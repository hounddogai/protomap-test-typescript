import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFlightOverrideReport } from "./default-flight-override-report.js";
import { DefaultFlightOverride, newDefaultFlightOverride } from "./default-flight-override.js";

test("DefaultFlightOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_980_524);
  const items: DefaultFlightOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultFlightOverride(`default-flight-override-${index}`, "sample"));
  }
  const report = buildDefaultFlightOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
