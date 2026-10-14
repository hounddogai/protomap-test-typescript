import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointSnapshot } from "./touchpoint-snapshot.js";

test("TouchpointSnapshot starts in requested", () => {
  const item = newTouchpointSnapshot("code-909", "name-752");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointSnapshot moves to expired", () => {
  const item = newTouchpointSnapshot("code-909", "name-752");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("TouchpointSnapshot rejects moves from expired", () => {
  const item = newTouchpointSnapshot("code-909", "name-752");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
