import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSenderRequest } from "./global-sender-request.js";

test("GlobalSenderRequest starts in planned", () => {
  const item = newGlobalSenderRequest("code-212", "name-643");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSenderRequest moves to cancelled", () => {
  const item = newGlobalSenderRequest("code-212", "name-643");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("GlobalSenderRequest rejects moves from cancelled", () => {
  const item = newGlobalSenderRequest("code-212", "name-643");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
