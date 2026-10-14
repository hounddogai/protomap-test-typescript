import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDoubleOptInProfile } from "./legacy-double-opt-in-profile.js";

test("LegacyDoubleOptInProfile starts in draft", () => {
  const item = newLegacyDoubleOptInProfile("code-2", "name-316");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDoubleOptInProfile moves to closed", () => {
  const item = newLegacyDoubleOptInProfile("code-2", "name-316");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("LegacyDoubleOptInProfile rejects moves from closed", () => {
  const item = newLegacyDoubleOptInProfile("code-2", "name-316");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
