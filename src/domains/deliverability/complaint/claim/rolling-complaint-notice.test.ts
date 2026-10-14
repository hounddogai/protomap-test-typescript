import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingComplaintNotice } from "./rolling-complaint-notice.js";

test("RollingComplaintNotice starts in requested", () => {
  const item = newRollingComplaintNotice("code-427", "title-83");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingComplaintNotice moves to granted", () => {
  const item = newRollingComplaintNotice("code-427", "title-83");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingComplaintNotice rejects moves from expired", () => {
  const item = newRollingComplaintNotice("code-427", "title-83");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
