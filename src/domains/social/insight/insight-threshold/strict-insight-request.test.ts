import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictInsightRequest } from "./strict-insight-request.js";

test("StrictInsightRequest starts in new", () => {
  const item = newStrictInsightRequest("code-603", "title-234");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictInsightRequest moves to queued", () => {
  const item = newStrictInsightRequest("code-603", "title-234");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictInsightRequest rejects moves from failed", () => {
  const item = newStrictInsightRequest("code-603", "title-234");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
