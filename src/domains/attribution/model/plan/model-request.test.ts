import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelRequest } from "./model-request.js";

test("ModelRequest starts in idle", () => {
  const item = newModelRequest("code-93", "label-647");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelRequest moves to warming", () => {
  const item = newModelRequest("code-93", "label-647");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ModelRequest rejects moves from stopped", () => {
  const item = newModelRequest("code-93", "label-647");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
