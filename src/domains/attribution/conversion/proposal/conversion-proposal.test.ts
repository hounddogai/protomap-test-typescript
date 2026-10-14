import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionProposal } from "./conversion-proposal.js";

test("ConversionProposal starts in requested", () => {
  const item = newConversionProposal("code-329", "title-356");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionProposal moves to granted", () => {
  const item = newConversionProposal("code-329", "title-356");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ConversionProposal rejects moves from expired", () => {
  const item = newConversionProposal("code-329", "title-356");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
