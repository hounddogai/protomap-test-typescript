import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultSenderRollupReport } from "./default-sender-rollup-report.js";
import { DefaultSenderRollup, newDefaultSenderRollup } from "./default-sender-rollup.js";

test("DefaultSenderRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_109_462);
  const items: DefaultSenderRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultSenderRollup(`default-sender-rollup-${index}`, "sample"));
  }
  const report = buildDefaultSenderRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
