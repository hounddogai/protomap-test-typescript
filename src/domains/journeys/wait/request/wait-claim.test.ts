import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitClaim } from "./wait-claim.js";

test("WaitClaim starts in open", () => {
  const item = newWaitClaim("code-453", "label-920");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitClaim moves to resolved", () => {
  const item = newWaitClaim("code-453", "label-920");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WaitClaim rejects moves from archived", () => {
  const item = newWaitClaim("code-453", "label-920");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
