import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyProposalReport } from "./reply-proposal-report.js";
import { ReplyProposal, newReplyProposal } from "./reply-proposal.js";

test("ReplyProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_864_407);
  const items: ReplyProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newReplyProposal(`reply-proposal-${index}`, "sample"));
  }
  const report = buildReplyProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
