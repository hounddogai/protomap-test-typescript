import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintRequest } from "./complaint-request.js";

test("ComplaintRequest starts in idle", () => {
  const item = newComplaintRequest("code-562", "title-826");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintRequest moves to warming", () => {
  const item = newComplaintRequest("code-562", "title-826");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ComplaintRequest rejects moves from stopped", () => {
  const item = newComplaintRequest("code-562", "title-826");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
