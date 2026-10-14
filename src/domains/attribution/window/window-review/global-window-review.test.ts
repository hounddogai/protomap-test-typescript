import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalWindowReview } from "./global-window-review.js";

test("GlobalWindowReview starts in requested", () => {
  const item = newGlobalWindowReview("code-516", "name-786");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalWindowReview moves to granted", () => {
  const item = newGlobalWindowReview("code-516", "name-786");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalWindowReview rejects moves from expired", () => {
  const item = newGlobalWindowReview("code-516", "name-786");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
