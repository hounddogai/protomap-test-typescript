import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyAgreement } from "./journey-agreement.js";

test("JourneyAgreement starts in draft", () => {
  const item = newJourneyAgreement("code-295", "title-381");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyAgreement moves to active", () => {
  const item = newJourneyAgreement("code-295", "title-381");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("JourneyAgreement rejects moves from closed", () => {
  const item = newJourneyAgreement("code-295", "title-381");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
