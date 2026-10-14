import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceBaseline } from "./bounce-baseline.js";

test("BounceBaseline starts in created", () => {
  const item = newBounceBaseline("code-465", "title-416");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceBaseline moves to retired", () => {
  const item = newBounceBaseline("code-465", "title-416");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("BounceBaseline rejects moves from retired", () => {
  const item = newBounceBaseline("code-465", "title-416");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
