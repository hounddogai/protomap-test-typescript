import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeEntry } from "./nudge-entry.js";

test("NudgeEntry starts in created", () => {
  const item = newNudgeEntry("code-508", "title-39");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeEntry moves to validated", () => {
  const item = newNudgeEntry("code-508", "title-39");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("NudgeEntry rejects moves from retired", () => {
  const item = newNudgeEntry("code-508", "title-39");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
