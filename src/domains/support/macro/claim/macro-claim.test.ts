import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroClaim } from "./macro-claim.js";

test("MacroClaim starts in requested", () => {
  const item = newMacroClaim("code-375", "name-521");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroClaim moves to granted", () => {
  const item = newMacroClaim("code-375", "name-521");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("MacroClaim rejects moves from expired", () => {
  const item = newMacroClaim("code-375", "name-521");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
