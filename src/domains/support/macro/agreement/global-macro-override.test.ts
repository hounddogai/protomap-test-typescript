import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalMacroOverride } from "./global-macro-override.js";

test("GlobalMacroOverride starts in requested", () => {
  const item = newGlobalMacroOverride("code-194", "label-578");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalMacroOverride moves to revoked", () => {
  const item = newGlobalMacroOverride("code-194", "label-578");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("GlobalMacroOverride rejects moves from expired", () => {
  const item = newGlobalMacroOverride("code-194", "label-578");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
