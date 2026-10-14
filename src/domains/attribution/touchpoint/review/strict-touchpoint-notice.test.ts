import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTouchpointNotice } from "./strict-touchpoint-notice.js";

test("StrictTouchpointNotice starts in open", () => {
  const item = newStrictTouchpointNotice("code-530", "label-646");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTouchpointNotice moves to in review", () => {
  const item = newStrictTouchpointNotice("code-530", "label-646");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictTouchpointNotice rejects moves from archived", () => {
  const item = newStrictTouchpointNotice("code-530", "label-646");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
