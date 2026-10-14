import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalDeflectionBaseline } from "./global-deflection-baseline.js";

test("GlobalDeflectionBaseline starts in requested", () => {
  const item = newGlobalDeflectionBaseline("code-735", "label-547");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalDeflectionBaseline moves to revoked", () => {
  const item = newGlobalDeflectionBaseline("code-735", "label-547");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("GlobalDeflectionBaseline rejects moves from expired", () => {
  const item = newGlobalDeflectionBaseline("code-735", "label-547");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
