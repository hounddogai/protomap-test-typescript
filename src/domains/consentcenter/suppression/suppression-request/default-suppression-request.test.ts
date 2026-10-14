import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSuppressionRequest } from "./default-suppression-request.js";

test("DefaultSuppressionRequest starts in created", () => {
  const item = newDefaultSuppressionRequest("code-383", "title-69");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSuppressionRequest moves to published", () => {
  const item = newDefaultSuppressionRequest("code-383", "title-69");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("DefaultSuppressionRequest rejects moves from retired", () => {
  const item = newDefaultSuppressionRequest("code-383", "title-69");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
