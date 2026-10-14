import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualWaitTarget } from "./manual-wait-target.js";

test("ManualWaitTarget starts in draft", () => {
  const item = newManualWaitTarget("code-223", "name-320");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualWaitTarget moves to closed", () => {
  const item = newManualWaitTarget("code-223", "name-320");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ManualWaitTarget rejects moves from closed", () => {
  const item = newManualWaitTarget("code-223", "name-320");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
