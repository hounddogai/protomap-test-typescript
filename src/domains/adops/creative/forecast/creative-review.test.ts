import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeReview } from "./creative-review.js";

test("CreativeReview starts in requested", () => {
  const item = newCreativeReview("code-92", "label-111");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeReview moves to granted", () => {
  const item = newCreativeReview("code-92", "label-111");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CreativeReview rejects moves from expired", () => {
  const item = newCreativeReview("code-92", "label-111");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
