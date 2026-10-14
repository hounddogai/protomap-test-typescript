import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionOverride } from "./retention-override.js";

test("RetentionOverride starts in open", () => {
  const item = newRetentionOverride("code-905", "title-43");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionOverride moves to resolved", () => {
  const item = newRetentionOverride("code-905", "title-43");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RetentionOverride rejects moves from archived", () => {
  const item = newRetentionOverride("code-905", "title-43");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
