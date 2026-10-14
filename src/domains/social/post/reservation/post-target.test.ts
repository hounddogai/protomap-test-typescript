import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostTarget } from "./post-target.js";

test("PostTarget starts in created", () => {
  const item = newPostTarget("code-895", "title-774");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostTarget moves to validated", () => {
  const item = newPostTarget("code-895", "title-774");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PostTarget rejects moves from retired", () => {
  const item = newPostTarget("code-895", "title-774");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
