import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPostProfile } from "./primary-post-profile.js";

test("PrimaryPostProfile starts in planned", () => {
  const item = newPrimaryPostProfile("code-475", "name-615");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPostProfile moves to scheduled", () => {
  const item = newPrimaryPostProfile("code-475", "name-615");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PrimaryPostProfile rejects moves from cancelled", () => {
  const item = newPrimaryPostProfile("code-475", "name-615");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
