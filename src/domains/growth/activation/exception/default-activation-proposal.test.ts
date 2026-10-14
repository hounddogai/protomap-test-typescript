import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultActivationProposal } from "./default-activation-proposal.js";

test("DefaultActivationProposal starts in requested", () => {
  const item = newDefaultActivationProposal("code-593", "title-483");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultActivationProposal moves to granted", () => {
  const item = newDefaultActivationProposal("code-593", "title-483");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DefaultActivationProposal rejects moves from expired", () => {
  const item = newDefaultActivationProposal("code-593", "title-483");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
