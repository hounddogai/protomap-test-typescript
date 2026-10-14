import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingNotice } from "./pacing-notice.js";

test("PacingNotice starts in proposed", () => {
  const item = newPacingNotice("code-321", "name-573");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingNotice moves to approved", () => {
  const item = newPacingNotice("code-321", "name-573");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PacingNotice rejects moves from withdrawn", () => {
  const item = newPacingNotice("code-321", "name-573");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
