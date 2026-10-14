import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightProposal } from "./flight-proposal.js";

test("FlightProposal starts in idle", () => {
  const item = newFlightProposal("code-611", "label-508");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightProposal moves to ready", () => {
  const item = newFlightProposal("code-611", "label-508");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FlightProposal rejects moves from stopped", () => {
  const item = newFlightProposal("code-611", "label-508");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
