import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofSchedule } from "./proof-schedule.js";

test("ProofSchedule starts in draft", () => {
  const item = newProofSchedule("code-401", "title-381");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofSchedule moves to suspended", () => {
  const item = newProofSchedule("code-401", "title-381");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ProofSchedule rejects moves from closed", () => {
  const item = newProofSchedule("code-401", "title-381");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
