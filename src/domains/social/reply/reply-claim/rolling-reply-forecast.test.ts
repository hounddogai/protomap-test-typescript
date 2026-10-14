import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingReplyForecast } from "./rolling-reply-forecast.js";

test("RollingReplyForecast starts in requested", () => {
  const item = newRollingReplyForecast("code-628", "name-667");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingReplyForecast moves to granted", () => {
  const item = newRollingReplyForecast("code-628", "name-667");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingReplyForecast rejects moves from expired", () => {
  const item = newRollingReplyForecast("code-628", "name-667");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
