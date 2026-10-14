import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCsatRequest } from "./adaptive-csat-request.js";

test("AdaptiveCsatRequest starts in draft", () => {
  const item = newAdaptiveCsatRequest("code-606", "name-662");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCsatRequest moves to closed", () => {
  const item = newAdaptiveCsatRequest("code-606", "name-662");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("AdaptiveCsatRequest rejects moves from closed", () => {
  const item = newAdaptiveCsatRequest("code-606", "name-662");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
