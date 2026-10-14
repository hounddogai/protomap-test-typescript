import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupProposalReport } from "./warmup-proposal-report.js";
import { WarmupProposal, newWarmupProposal } from "./warmup-proposal.js";

test("WarmupProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_038_559);
  const items: WarmupProposal[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWarmupProposal(`warmup-proposal-${index}`, "sample"));
  }
  const report = buildWarmupProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
