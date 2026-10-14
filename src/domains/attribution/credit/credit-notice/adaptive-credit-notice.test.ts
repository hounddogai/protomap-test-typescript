import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCreditNotice } from "./adaptive-credit-notice.js";

test("AdaptiveCreditNotice starts in idle", () => {
  const item = newAdaptiveCreditNotice("code-451", "title-88");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCreditNotice moves to warming", () => {
  const item = newAdaptiveCreditNotice("code-451", "title-88");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveCreditNotice rejects moves from stopped", () => {
  const item = newAdaptiveCreditNotice("code-451", "title-88");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
