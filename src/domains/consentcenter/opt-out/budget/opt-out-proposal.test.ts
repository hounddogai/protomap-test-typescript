import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutProposal } from "./opt-out-proposal.js";

test("OptOutProposal starts in requested", () => {
  const item = newOptOutProposal("code-483", "label-898");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutProposal moves to granted", () => {
  const item = newOptOutProposal("code-483", "label-898");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("OptOutProposal rejects moves from expired", () => {
  const item = newOptOutProposal("code-483", "label-898");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
