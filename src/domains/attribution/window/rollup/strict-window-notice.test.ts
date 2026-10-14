import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictWindowNotice } from "./strict-window-notice.js";

test("StrictWindowNotice starts in new", () => {
  const item = newStrictWindowNotice("code-261", "label-672");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictWindowNotice moves to done", () => {
  const item = newStrictWindowNotice("code-261", "label-672");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StrictWindowNotice rejects moves from failed", () => {
  const item = newStrictWindowNotice("code-261", "label-672");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
