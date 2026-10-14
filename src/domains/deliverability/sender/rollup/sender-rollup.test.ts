import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderRollup } from "./sender-rollup.js";

test("SenderRollup starts in created", () => {
  const item = newSenderRollup("code-344", "title-209");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderRollup moves to published", () => {
  const item = newSenderRollup("code-344", "title-209");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SenderRollup rejects moves from retired", () => {
  const item = newSenderRollup("code-344", "title-209");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
