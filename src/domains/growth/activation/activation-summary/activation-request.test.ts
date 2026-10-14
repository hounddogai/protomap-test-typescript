import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationRequest } from "./activation-request.js";

test("ActivationRequest starts in requested", () => {
  const item = newActivationRequest("code-471", "title-782");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationRequest moves to revoked", () => {
  const item = newActivationRequest("code-471", "title-782");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ActivationRequest rejects moves from expired", () => {
  const item = newActivationRequest("code-471", "title-782");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
