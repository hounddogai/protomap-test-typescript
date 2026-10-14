import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionWindow } from "./deflection-window.js";

test("DeflectionWindow starts in requested", () => {
  const item = newDeflectionWindow("code-375", "name-881");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionWindow moves to revoked", () => {
  const item = newDeflectionWindow("code-375", "name-881");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DeflectionWindow rejects moves from expired", () => {
  const item = newDeflectionWindow("code-375", "name-881");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
