import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBounceRecord } from "./capped-bounce-record.js";

test("CappedBounceRecord starts in idle", () => {
  const item = newCappedBounceRecord("code-586", "title-825");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBounceRecord moves to warming", () => {
  const item = newCappedBounceRecord("code-586", "title-825");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedBounceRecord rejects moves from stopped", () => {
  const item = newCappedBounceRecord("code-586", "title-825");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
