import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowGroup } from "./window-group.js";

test("WindowGroup starts in requested", () => {
  const item = newWindowGroup("code-637", "name-579");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowGroup moves to granted", () => {
  const item = newWindowGroup("code-637", "name-579");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WindowGroup rejects moves from expired", () => {
  const item = newWindowGroup("code-637", "name-579");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
