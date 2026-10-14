import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDomainScore } from "./adaptive-domain-score.js";

test("AdaptiveDomainScore starts in new", () => {
  const item = newAdaptiveDomainScore("code-362", "name-173");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDomainScore moves to queued", () => {
  const item = newAdaptiveDomainScore("code-362", "name-173");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveDomainScore rejects moves from failed", () => {
  const item = newAdaptiveDomainScore("code-362", "name-173");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
