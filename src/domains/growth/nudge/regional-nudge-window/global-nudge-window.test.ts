import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalNudgeWindow } from "./global-nudge-window.js";

test("GlobalNudgeWindow starts in proposed", () => {
  const item = newGlobalNudgeWindow("code-693", "name-835");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalNudgeWindow moves to withdrawn", () => {
  const item = newGlobalNudgeWindow("code-693", "name-835");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("GlobalNudgeWindow rejects moves from withdrawn", () => {
  const item = newGlobalNudgeWindow("code-693", "name-835");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
