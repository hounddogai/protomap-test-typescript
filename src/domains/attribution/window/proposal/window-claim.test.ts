import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowClaim } from "./window-claim.js";

test("WindowClaim starts in created", () => {
  const item = newWindowClaim("code-180", "title-907");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowClaim moves to validated", () => {
  const item = newWindowClaim("code-180", "title-907");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WindowClaim rejects moves from retired", () => {
  const item = newWindowClaim("code-180", "title-907");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
