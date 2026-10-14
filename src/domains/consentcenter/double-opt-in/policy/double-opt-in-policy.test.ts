import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInPolicy } from "./double-opt-in-policy.js";

test("DoubleOptInPolicy starts in idle", () => {
  const item = newDoubleOptInPolicy("code-800", "label-954");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInPolicy moves to draining", () => {
  const item = newDoubleOptInPolicy("code-800", "label-954");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("DoubleOptInPolicy rejects moves from stopped", () => {
  const item = newDoubleOptInPolicy("code-800", "label-954");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
