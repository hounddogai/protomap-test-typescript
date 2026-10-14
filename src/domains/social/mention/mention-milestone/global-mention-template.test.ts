import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalMentionTemplate } from "./global-mention-template.js";

test("GlobalMentionTemplate starts in open", () => {
  const item = newGlobalMentionTemplate("code-700", "label-260");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalMentionTemplate moves to in review", () => {
  const item = newGlobalMentionTemplate("code-700", "label-260");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalMentionTemplate rejects moves from archived", () => {
  const item = newGlobalMentionTemplate("code-700", "label-260");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
