import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReplyAgreement } from "./regional-reply-agreement.js";

test("RegionalReplyAgreement starts in proposed", () => {
  const item = newRegionalReplyAgreement("code-238", "title-769");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReplyAgreement moves to withdrawn", () => {
  const item = newRegionalReplyAgreement("code-238", "title-769");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RegionalReplyAgreement rejects moves from withdrawn", () => {
  const item = newRegionalReplyAgreement("code-238", "title-769");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
