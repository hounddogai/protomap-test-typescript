import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostBundle } from "./post-bundle.js";

test("PostBundle starts in proposed", () => {
  const item = newPostBundle("code-520", "name-252");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostBundle moves to rejected", () => {
  const item = newPostBundle("code-520", "name-252");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PostBundle rejects moves from withdrawn", () => {
  const item = newPostBundle("code-520", "name-252");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
