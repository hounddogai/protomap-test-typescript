import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSenderRollup } from "./default-sender-rollup.js";

test("DefaultSenderRollup starts in requested", () => {
  const item = newDefaultSenderRollup("code-381", "label-487");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSenderRollup moves to expired", () => {
  const item = newDefaultSenderRollup("code-381", "label-487");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("DefaultSenderRollup rejects moves from expired", () => {
  const item = newDefaultSenderRollup("code-381", "label-487");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
