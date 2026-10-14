import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBounceNotice } from "./regional-bounce-notice.js";

test("RegionalBounceNotice starts in requested", () => {
  const item = newRegionalBounceNotice("code-360", "name-135");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBounceNotice moves to granted", () => {
  const item = newRegionalBounceNotice("code-360", "name-135");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalBounceNotice rejects moves from expired", () => {
  const item = newRegionalBounceNotice("code-360", "name-135");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
