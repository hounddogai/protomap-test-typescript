import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofGroupReport } from "./proof-group-report.js";
import { ProofGroup, newProofGroup } from "./proof-group.js";

test("ProofGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_372_211);
  const items: ProofGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newProofGroup(`proof-group-${index}`, "sample"));
  }
  const report = buildProofGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
