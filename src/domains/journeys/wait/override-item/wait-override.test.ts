import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitOverride } from "./wait-override.js";

test("WaitOverride starts in created", () => {
  const item = newWaitOverride("code-957", "label-450");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitOverride moves to published", () => {
  const item = newWaitOverride("code-957", "label-450");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WaitOverride rejects moves from retired", () => {
  const item = newWaitOverride("code-957", "label-450");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
