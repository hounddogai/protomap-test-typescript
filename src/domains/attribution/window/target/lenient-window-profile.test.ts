import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWindowProfile } from "./lenient-window-profile.js";

test("LenientWindowProfile starts in new", () => {
  const item = newLenientWindowProfile("code-621", "label-604");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWindowProfile moves to running", () => {
  const item = newLenientWindowProfile("code-621", "label-604");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientWindowProfile rejects moves from failed", () => {
  const item = newLenientWindowProfile("code-621", "label-604");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
