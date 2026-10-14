import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultActivationProposalReport } from "./default-activation-proposal-report.js";
import { DefaultActivationProposal, newDefaultActivationProposal } from "./default-activation-proposal.js";

test("DefaultActivationProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_445_374);
  const items: DefaultActivationProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultActivationProposal(`default-activation-proposal-${index}`, "sample"));
  }
  const report = buildDefaultActivationProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
