import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationRecord } from "./activation-record.js";

test("ActivationRecord starts in requested", () => {
  const item = newActivationRecord("code-768", "name-340");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationRecord moves to revoked", () => {
  const item = newActivationRecord("code-768", "name-340");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ActivationRecord rejects moves from expired", () => {
  const item = newActivationRecord("code-768", "name-340");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
