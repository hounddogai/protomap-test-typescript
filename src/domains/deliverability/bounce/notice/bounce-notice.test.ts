import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceNotice } from "./bounce-notice.js";

test("BounceNotice starts in planned", () => {
  const item = newBounceNotice("code-980", "label-904");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceNotice moves to scheduled", () => {
  const item = newBounceNotice("code-980", "label-904");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BounceNotice rejects moves from cancelled", () => {
  const item = newBounceNotice("code-980", "label-904");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
