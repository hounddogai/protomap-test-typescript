import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelAgreement } from "./level-agreement.js";

test("LevelAgreement starts in open", () => {
  const item = newLevelAgreement("code-825", "label-767");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelAgreement moves to resolved", () => {
  const item = newLevelAgreement("code-825", "label-767");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LevelAgreement rejects moves from archived", () => {
  const item = newLevelAgreement("code-825", "label-767");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
