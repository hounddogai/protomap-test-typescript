import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteMapping } from "./invite-mapping.js";

test("InviteMapping starts in created", () => {
  const item = newInviteMapping("code-585", "name-855");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteMapping moves to validated", () => {
  const item = newInviteMapping("code-585", "name-855");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("InviteMapping rejects moves from retired", () => {
  const item = newInviteMapping("code-585", "name-855");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
