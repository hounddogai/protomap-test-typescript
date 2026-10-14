import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPathRequest } from "./regional-path-request.js";

test("RegionalPathRequest starts in new", () => {
  const item = newRegionalPathRequest("code-190", "name-498");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPathRequest moves to done", () => {
  const item = newRegionalPathRequest("code-190", "name-498");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RegionalPathRequest rejects moves from failed", () => {
  const item = newRegionalPathRequest("code-190", "name-498");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
