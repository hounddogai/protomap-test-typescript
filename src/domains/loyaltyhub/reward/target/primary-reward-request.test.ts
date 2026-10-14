import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryRewardRequest } from "./primary-reward-request.js";

test("PrimaryRewardRequest starts in draft", () => {
  const item = newPrimaryRewardRequest("code-434", "name-937");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryRewardRequest moves to active", () => {
  const item = newPrimaryRewardRequest("code-434", "name-937");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimaryRewardRequest rejects moves from closed", () => {
  const item = newPrimaryRewardRequest("code-434", "name-937");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
