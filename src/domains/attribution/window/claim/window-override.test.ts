import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowOverride } from "./window-override.js";

test("WindowOverride starts in open", () => {
  const item = newWindowOverride("code-131", "title-390");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowOverride moves to in review", () => {
  const item = newWindowOverride("code-131", "title-390");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WindowOverride rejects moves from archived", () => {
  const item = newWindowOverride("code-131", "title-390");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
