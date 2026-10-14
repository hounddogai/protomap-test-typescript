import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBounceNotice } from "./manual-bounce-notice.js";

test("ManualBounceNotice starts in requested", () => {
  const item = newManualBounceNotice("code-135", "title-747");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBounceNotice moves to granted", () => {
  const item = newManualBounceNotice("code-135", "title-747");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualBounceNotice rejects moves from expired", () => {
  const item = newManualBounceNotice("code-135", "title-747");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
