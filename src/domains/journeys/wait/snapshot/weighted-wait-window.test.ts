import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWaitWindow } from "./weighted-wait-window.js";

test("WeightedWaitWindow starts in requested", () => {
  const item = newWeightedWaitWindow("code-231", "label-31");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWaitWindow moves to revoked", () => {
  const item = newWeightedWaitWindow("code-231", "label-31");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("WeightedWaitWindow rejects moves from expired", () => {
  const item = newWeightedWaitWindow("code-231", "label-31");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
