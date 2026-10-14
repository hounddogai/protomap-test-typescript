import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPacingRequest } from "./global-pacing-request.js";

test("GlobalPacingRequest starts in requested", () => {
  const item = newGlobalPacingRequest("code-546", "label-496");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPacingRequest moves to expired", () => {
  const item = newGlobalPacingRequest("code-546", "label-496");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalPacingRequest rejects moves from expired", () => {
  const item = newGlobalPacingRequest("code-546", "label-496");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
