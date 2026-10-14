import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostOverride } from "./post-override.js";

test("PostOverride starts in created", () => {
  const item = newPostOverride("code-844", "title-920");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostOverride moves to retired", () => {
  const item = newPostOverride("code-844", "title-920");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PostOverride rejects moves from retired", () => {
  const item = newPostOverride("code-844", "title-920");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
