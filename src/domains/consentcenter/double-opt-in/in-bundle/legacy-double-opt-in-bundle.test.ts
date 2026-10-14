import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

test("LegacyDoubleOptInBundle starts in proposed", () => {
  const item = newLegacyDoubleOptInBundle("code-863", "title-691");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDoubleOptInBundle moves to approved", () => {
  const item = newLegacyDoubleOptInBundle("code-863", "title-691");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyDoubleOptInBundle rejects moves from withdrawn", () => {
  const item = newLegacyDoubleOptInBundle("code-863", "title-691");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
