import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchNotice } from "./branch-notice.js";

test("BranchNotice starts in planned", () => {
  const item = newBranchNotice("code-295", "name-665");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchNotice moves to scheduled", () => {
  const item = newBranchNotice("code-295", "name-665");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BranchNotice rejects moves from cancelled", () => {
  const item = newBranchNotice("code-295", "name-665");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
