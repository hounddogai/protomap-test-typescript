import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationClaim } from "./activation-claim.js";

test("ActivationClaim starts in draft", () => {
  const item = newActivationClaim("code-401", "label-906");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationClaim moves to active", () => {
  const item = newActivationClaim("code-401", "label-906");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ActivationClaim rejects moves from closed", () => {
  const item = newActivationClaim("code-401", "label-906");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
