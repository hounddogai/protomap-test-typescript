import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceTier } from "./bounce-tier.js";

test("BounceTier starts in draft", () => {
  const item = newBounceTier("code-550", "name-551");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceTier moves to pending", () => {
  const item = newBounceTier("code-550", "name-551");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BounceTier rejects moves from closed", () => {
  const item = newBounceTier("code-550", "name-551");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
