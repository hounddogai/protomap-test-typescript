import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroQuota } from "./macro-quota.js";

test("MacroQuota starts in requested", () => {
  const item = newMacroQuota("code-486", "name-538");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroQuota moves to expired", () => {
  const item = newMacroQuota("code-486", "name-538");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("MacroQuota rejects moves from expired", () => {
  const item = newMacroQuota("code-486", "name-538");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
