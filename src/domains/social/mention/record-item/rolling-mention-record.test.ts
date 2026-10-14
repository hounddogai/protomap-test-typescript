import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingMentionRecord } from "./rolling-mention-record.js";

test("RollingMentionRecord starts in created", () => {
  const item = newRollingMentionRecord("code-528", "name-715");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingMentionRecord moves to validated", () => {
  const item = newRollingMentionRecord("code-528", "name-715");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingMentionRecord rejects moves from retired", () => {
  const item = newRollingMentionRecord("code-528", "name-715");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
