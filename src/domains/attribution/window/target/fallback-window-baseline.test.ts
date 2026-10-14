import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackWindowBaseline } from "./fallback-window-baseline.js";

test("FallbackWindowBaseline starts in new", () => {
  const item = newFallbackWindowBaseline("code-66", "label-764");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackWindowBaseline moves to queued", () => {
  const item = newFallbackWindowBaseline("code-66", "label-764");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackWindowBaseline rejects moves from failed", () => {
  const item = newFallbackWindowBaseline("code-66", "label-764");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
