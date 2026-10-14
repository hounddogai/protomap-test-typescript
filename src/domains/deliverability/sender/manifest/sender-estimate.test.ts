import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderEstimate } from "./sender-estimate.js";

test("SenderEstimate starts in requested", () => {
  const item = newSenderEstimate("code-547", "label-170");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderEstimate moves to expired", () => {
  const item = newSenderEstimate("code-547", "label-170");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SenderEstimate rejects moves from expired", () => {
  const item = newSenderEstimate("code-547", "label-170");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
