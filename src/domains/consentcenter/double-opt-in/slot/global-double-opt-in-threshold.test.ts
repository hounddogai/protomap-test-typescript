import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalDoubleOptInThreshold } from "./global-double-opt-in-threshold.js";

test("GlobalDoubleOptInThreshold starts in requested", () => {
  const item = newGlobalDoubleOptInThreshold("code-25", "name-461");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalDoubleOptInThreshold moves to expired", () => {
  const item = newGlobalDoubleOptInThreshold("code-25", "name-461");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalDoubleOptInThreshold rejects moves from expired", () => {
  const item = newGlobalDoubleOptInThreshold("code-25", "name-461");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
