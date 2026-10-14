import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaGroup } from "./sla-group.js";

test("SlaGroup starts in open", () => {
  const item = newSlaGroup("code-799", "title-736");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaGroup moves to resolved", () => {
  const item = newSlaGroup("code-799", "title-736");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SlaGroup rejects moves from archived", () => {
  const item = newSlaGroup("code-799", "title-736");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
