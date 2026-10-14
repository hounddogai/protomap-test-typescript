import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFlightOverride } from "./primary-flight-override.js";

test("PrimaryFlightOverride starts in proposed", () => {
  const item = newPrimaryFlightOverride("code-530", "label-687");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFlightOverride moves to approved", () => {
  const item = newPrimaryFlightOverride("code-530", "label-687");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryFlightOverride rejects moves from withdrawn", () => {
  const item = newPrimaryFlightOverride("code-530", "label-687");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
