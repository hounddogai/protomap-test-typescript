import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedChallengeSnapshot } from "./capped-challenge-snapshot.js";

test("CappedChallengeSnapshot starts in open", () => {
  const item = newCappedChallengeSnapshot("code-83", "label-278");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedChallengeSnapshot moves to reopened", () => {
  const item = newCappedChallengeSnapshot("code-83", "label-278");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("CappedChallengeSnapshot rejects moves from archived", () => {
  const item = newCappedChallengeSnapshot("code-83", "label-278");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
