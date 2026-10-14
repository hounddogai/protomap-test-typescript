import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryDomainProposal } from "./primary-domain-proposal.js";

test("PrimaryDomainProposal starts in requested", () => {
  const item = newPrimaryDomainProposal("code-773", "label-874");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryDomainProposal moves to granted", () => {
  const item = newPrimaryDomainProposal("code-773", "label-874");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryDomainProposal rejects moves from expired", () => {
  const item = newPrimaryDomainProposal("code-773", "label-874");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
