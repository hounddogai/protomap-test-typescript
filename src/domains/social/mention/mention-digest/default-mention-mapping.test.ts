import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMentionMapping } from "./default-mention-mapping.js";

test("DefaultMentionMapping starts in requested", () => {
  const item = newDefaultMentionMapping("code-825", "label-606");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMentionMapping moves to granted", () => {
  const item = newDefaultMentionMapping("code-825", "label-606");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DefaultMentionMapping rejects moves from expired", () => {
  const item = newDefaultMentionMapping("code-825", "label-606");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
