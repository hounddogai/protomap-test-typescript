import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowTarget } from "./window-target.js";

test("WindowTarget starts in requested", () => {
  const item = newWindowTarget("code-593", "name-164");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowTarget moves to granted", () => {
  const item = newWindowTarget("code-593", "name-164");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WindowTarget rejects moves from expired", () => {
  const item = newWindowTarget("code-593", "name-164");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
