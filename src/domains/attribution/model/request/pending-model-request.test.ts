import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingModelRequest } from "./pending-model-request.js";

test("PendingModelRequest starts in requested", () => {
  const item = newPendingModelRequest("code-917", "title-913");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingModelRequest moves to granted", () => {
  const item = newPendingModelRequest("code-917", "title-913");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PendingModelRequest rejects moves from expired", () => {
  const item = newPendingModelRequest("code-917", "title-913");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
