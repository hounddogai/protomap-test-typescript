import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedNudgeEntry } from "./capped-nudge-entry.js";

test("CappedNudgeEntry starts in created", () => {
  const item = newCappedNudgeEntry("code-413", "label-281");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedNudgeEntry moves to published", () => {
  const item = newCappedNudgeEntry("code-413", "label-281");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("CappedNudgeEntry rejects moves from retired", () => {
  const item = newCappedNudgeEntry("code-413", "label-281");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
