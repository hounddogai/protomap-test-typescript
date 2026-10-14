import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

test("SeasonalInviteMilestone starts in requested", () => {
  const item = newSeasonalInviteMilestone("code-821", "title-98");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalInviteMilestone moves to revoked", () => {
  const item = newSeasonalInviteMilestone("code-821", "title-98");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("SeasonalInviteMilestone rejects moves from expired", () => {
  const item = newSeasonalInviteMilestone("code-821", "title-98");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
