import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowNotice } from "./window-notice.js";

test("WindowNotice starts in created", () => {
  const item = newWindowNotice("code-306", "title-167");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowNotice moves to published", () => {
  const item = newWindowNotice("code-306", "title-167");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WindowNotice rejects moves from retired", () => {
  const item = newWindowNotice("code-306", "title-167");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
