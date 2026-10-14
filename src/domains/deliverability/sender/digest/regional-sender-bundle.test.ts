import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSenderBundle } from "./regional-sender-bundle.js";

test("RegionalSenderBundle starts in proposed", () => {
  const item = newRegionalSenderBundle("code-936", "label-687");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSenderBundle moves to approved", () => {
  const item = newRegionalSenderBundle("code-936", "label-687");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RegionalSenderBundle rejects moves from withdrawn", () => {
  const item = newRegionalSenderBundle("code-936", "label-687");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
