import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

test("AdaptiveDoubleOptInException starts in requested", () => {
  const item = newAdaptiveDoubleOptInException("code-509", "name-921");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDoubleOptInException moves to granted", () => {
  const item = newAdaptiveDoubleOptInException("code-509", "name-921");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptiveDoubleOptInException rejects moves from expired", () => {
  const item = newAdaptiveDoubleOptInException("code-509", "name-921");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
