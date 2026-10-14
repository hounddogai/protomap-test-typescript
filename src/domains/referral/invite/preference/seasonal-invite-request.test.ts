import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalInviteRequest } from "./seasonal-invite-request.js";

test("SeasonalInviteRequest starts in idle", () => {
  const item = newSeasonalInviteRequest("code-620", "name-51");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalInviteRequest moves to warming", () => {
  const item = newSeasonalInviteRequest("code-620", "name-51");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalInviteRequest rejects moves from stopped", () => {
  const item = newSeasonalInviteRequest("code-620", "name-51");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
