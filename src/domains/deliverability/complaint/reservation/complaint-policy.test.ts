import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintPolicy } from "./complaint-policy.js";

test("ComplaintPolicy starts in requested", () => {
  const item = newComplaintPolicy("code-554", "title-877");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintPolicy moves to granted", () => {
  const item = newComplaintPolicy("code-554", "title-877");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ComplaintPolicy rejects moves from expired", () => {
  const item = newComplaintPolicy("code-554", "title-877");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
