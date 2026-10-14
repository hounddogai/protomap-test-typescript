import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReputationException } from "./strict-reputation-exception.js";

test("StrictReputationException starts in requested", () => {
  const item = newStrictReputationException("code-375", "name-546");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReputationException moves to granted", () => {
  const item = newStrictReputationException("code-375", "name-546");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictReputationException rejects moves from expired", () => {
  const item = newStrictReputationException("code-375", "name-546");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
