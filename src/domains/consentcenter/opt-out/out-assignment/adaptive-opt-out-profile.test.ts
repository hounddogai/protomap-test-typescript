import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

test("AdaptiveOptOutProfile starts in proposed", () => {
  const item = newAdaptiveOptOutProfile("code-838", "name-878");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveOptOutProfile moves to rejected", () => {
  const item = newAdaptiveOptOutProfile("code-838", "name-878");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("AdaptiveOptOutProfile rejects moves from withdrawn", () => {
  const item = newAdaptiveOptOutProfile("code-838", "name-878");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
