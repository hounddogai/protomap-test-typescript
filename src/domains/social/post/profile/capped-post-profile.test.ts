import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPostProfile } from "./capped-post-profile.js";

test("CappedPostProfile starts in draft", () => {
  const item = newCappedPostProfile("code-563", "title-392");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPostProfile moves to closed", () => {
  const item = newCappedPostProfile("code-563", "title-392");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("CappedPostProfile rejects moves from closed", () => {
  const item = newCappedPostProfile("code-563", "title-392");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
