import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWindowBaseline } from "./legacy-window-baseline.js";

test("LegacyWindowBaseline starts in created", () => {
  const item = newLegacyWindowBaseline("code-688", "label-837");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWindowBaseline moves to validated", () => {
  const item = newLegacyWindowBaseline("code-688", "label-837");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyWindowBaseline rejects moves from retired", () => {
  const item = newLegacyWindowBaseline("code-688", "label-837");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
