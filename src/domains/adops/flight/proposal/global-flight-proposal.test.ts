import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFlightProposal } from "./global-flight-proposal.js";

test("GlobalFlightProposal starts in planned", () => {
  const item = newGlobalFlightProposal("code-213", "name-413");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFlightProposal moves to scheduled", () => {
  const item = newGlobalFlightProposal("code-213", "name-413");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("GlobalFlightProposal rejects moves from cancelled", () => {
  const item = newGlobalFlightProposal("code-213", "name-413");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
