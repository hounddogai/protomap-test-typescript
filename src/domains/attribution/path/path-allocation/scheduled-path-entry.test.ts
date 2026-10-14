import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPathEntry } from "./scheduled-path-entry.js";

test("ScheduledPathEntry starts in new", () => {
  const item = newScheduledPathEntry("code-703", "name-403");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPathEntry moves to queued", () => {
  const item = newScheduledPathEntry("code-703", "name-403");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledPathEntry rejects moves from failed", () => {
  const item = newScheduledPathEntry("code-703", "name-403");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
