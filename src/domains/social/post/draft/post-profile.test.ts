import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostProfile } from "./post-profile.js";

test("PostProfile starts in requested", () => {
  const item = newPostProfile("code-28", "label-594");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostProfile moves to granted", () => {
  const item = newPostProfile("code-28", "label-594");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PostProfile rejects moves from expired", () => {
  const item = newPostProfile("code-28", "label-594");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
