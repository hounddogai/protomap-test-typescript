import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionNotice } from "./deflection-notice.js";

test("DeflectionNotice starts in requested", () => {
  const item = newDeflectionNotice("code-179", "name-445");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionNotice moves to granted", () => {
  const item = newDeflectionNotice("code-179", "name-445");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DeflectionNotice rejects moves from expired", () => {
  const item = newDeflectionNotice("code-179", "name-445");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
