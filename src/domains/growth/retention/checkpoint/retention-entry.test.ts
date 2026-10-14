import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionEntry } from "./retention-entry.js";

test("RetentionEntry starts in open", () => {
  const item = newRetentionEntry("code-448", "name-517");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionEntry moves to reopened", () => {
  const item = newRetentionEntry("code-448", "name-517");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RetentionEntry rejects moves from archived", () => {
  const item = newRetentionEntry("code-448", "name-517");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
