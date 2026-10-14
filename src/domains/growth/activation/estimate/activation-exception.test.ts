import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationException } from "./activation-exception.js";

test("ActivationException starts in requested", () => {
  const item = newActivationException("code-460", "name-307");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationException moves to expired", () => {
  const item = newActivationException("code-460", "name-307");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ActivationException rejects moves from expired", () => {
  const item = newActivationException("code-460", "name-307");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
