import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDeflectionClaim } from "./lenient-deflection-claim.js";

test("LenientDeflectionClaim starts in proposed", () => {
  const item = newLenientDeflectionClaim("code-764", "name-573");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDeflectionClaim moves to rejected", () => {
  const item = newLenientDeflectionClaim("code-764", "name-573");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LenientDeflectionClaim rejects moves from withdrawn", () => {
  const item = newLenientDeflectionClaim("code-764", "name-573");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
