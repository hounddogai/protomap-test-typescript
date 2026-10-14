import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointRecord } from "./touchpoint-record.js";

test("TouchpointRecord starts in new", () => {
  const item = newTouchpointRecord("code-414", "name-820");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointRecord moves to done", () => {
  const item = newTouchpointRecord("code-414", "name-820");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TouchpointRecord rejects moves from failed", () => {
  const item = newTouchpointRecord("code-414", "name-820");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
