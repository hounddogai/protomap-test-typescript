import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceProfile } from "./bounce-profile.js";

test("BounceProfile starts in open", () => {
  const item = newBounceProfile("code-546", "label-822");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceProfile moves to resolved", () => {
  const item = newBounceProfile("code-546", "label-822");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BounceProfile rejects moves from archived", () => {
  const item = newBounceProfile("code-546", "label-822");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
