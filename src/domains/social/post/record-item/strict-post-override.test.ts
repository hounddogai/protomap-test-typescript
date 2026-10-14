import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPostOverride } from "./strict-post-override.js";

test("StrictPostOverride starts in new", () => {
  const item = newStrictPostOverride("code-287", "name-266");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPostOverride moves to queued", () => {
  const item = newStrictPostOverride("code-287", "name-266");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictPostOverride rejects moves from failed", () => {
  const item = newStrictPostOverride("code-287", "name-266");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
