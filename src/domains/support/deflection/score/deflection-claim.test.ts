import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionClaim } from "./deflection-claim.js";

test("DeflectionClaim starts in new", () => {
  const item = newDeflectionClaim("code-925", "title-768");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionClaim moves to running", () => {
  const item = newDeflectionClaim("code-925", "title-768");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DeflectionClaim rejects moves from failed", () => {
  const item = newDeflectionClaim("code-925", "title-768");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
