import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionProposalReport } from "./subscription-proposal-report.js";
import { SubscriptionProposal, newSubscriptionProposal } from "./subscription-proposal.js";

test("SubscriptionProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_518_521);
  const items: SubscriptionProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSubscriptionProposal(`subscription-proposal-${index}`, "sample"));
  }
  const report = buildSubscriptionProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
