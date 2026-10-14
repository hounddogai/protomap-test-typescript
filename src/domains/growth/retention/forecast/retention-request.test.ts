import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionRequest } from "./retention-request.js";

test("RetentionRequest starts in created", () => {
  const item = newRetentionRequest("code-711", "name-688");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionRequest moves to validated", () => {
  const item = newRetentionRequest("code-711", "name-688");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RetentionRequest rejects moves from retired", () => {
  const item = newRetentionRequest("code-711", "name-688");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
