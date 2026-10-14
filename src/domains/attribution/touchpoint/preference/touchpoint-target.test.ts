import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointTarget } from "./touchpoint-target.js";

test("TouchpointTarget starts in created", () => {
  const item = newTouchpointTarget("code-989", "name-841");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointTarget moves to retired", () => {
  const item = newTouchpointTarget("code-989", "name-841");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("TouchpointTarget rejects moves from retired", () => {
  const item = newTouchpointTarget("code-989", "name-841");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
