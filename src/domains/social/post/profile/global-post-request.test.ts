import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPostRequest } from "./global-post-request.js";

test("GlobalPostRequest starts in draft", () => {
  const item = newGlobalPostRequest("code-494", "label-36");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPostRequest moves to suspended", () => {
  const item = newGlobalPostRequest("code-494", "label-36");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("GlobalPostRequest rejects moves from closed", () => {
  const item = newGlobalPostRequest("code-494", "label-36");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
