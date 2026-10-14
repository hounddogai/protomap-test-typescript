import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInThreshold } from "./double-opt-in-threshold.js";

test("DoubleOptInThreshold starts in requested", () => {
  const item = newDoubleOptInThreshold("code-833", "title-637");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInThreshold moves to granted", () => {
  const item = newDoubleOptInThreshold("code-833", "title-637");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DoubleOptInThreshold rejects moves from expired", () => {
  const item = newDoubleOptInThreshold("code-833", "title-637");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
