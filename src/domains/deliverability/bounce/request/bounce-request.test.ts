import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceRequest } from "./bounce-request.js";

test("BounceRequest starts in open", () => {
  const item = newBounceRequest("code-942", "title-167");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceRequest moves to reopened", () => {
  const item = newBounceRequest("code-942", "title-167");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BounceRequest rejects moves from archived", () => {
  const item = newBounceRequest("code-942", "title-167");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
