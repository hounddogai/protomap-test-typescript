import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitNotice } from "./wait-notice.js";

test("WaitNotice starts in planned", () => {
  const item = newWaitNotice("code-544", "name-412");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitNotice moves to scheduled", () => {
  const item = newWaitNotice("code-544", "name-412");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WaitNotice rejects moves from cancelled", () => {
  const item = newWaitNotice("code-544", "name-412");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
