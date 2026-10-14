import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalChallengeProposalReport } from "./global-challenge-proposal-report.js";
import { GlobalChallengeProposal, newGlobalChallengeProposal } from "./global-challenge-proposal.js";

test("GlobalChallengeProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_928_647);
  const items: GlobalChallengeProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalChallengeProposal(`global-challenge-proposal-${index}`, "sample"));
  }
  const report = buildGlobalChallengeProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
