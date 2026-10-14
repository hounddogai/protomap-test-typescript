import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientStreakNotice } from "./lenient-streak-notice.js";

test("LenientStreakNotice starts in requested", () => {
  const item = newLenientStreakNotice("code-49", "title-604");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientStreakNotice moves to granted", () => {
  const item = newLenientStreakNotice("code-49", "title-604");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LenientStreakNotice rejects moves from expired", () => {
  const item = newLenientStreakNotice("code-49", "title-604");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
