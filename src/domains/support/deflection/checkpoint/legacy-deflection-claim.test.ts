import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDeflectionClaim } from "./legacy-deflection-claim.js";

test("LegacyDeflectionClaim starts in new", () => {
  const item = newLegacyDeflectionClaim("code-55", "label-351");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDeflectionClaim moves to running", () => {
  const item = newLegacyDeflectionClaim("code-55", "label-351");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyDeflectionClaim rejects moves from failed", () => {
  const item = newLegacyDeflectionClaim("code-55", "label-351");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
