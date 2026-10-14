import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeNotice } from "./creative-notice.js";

test("CreativeNotice starts in requested", () => {
  const item = newCreativeNotice("code-931", "title-53");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeNotice moves to granted", () => {
  const item = newCreativeNotice("code-931", "title-53");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CreativeNotice rejects moves from expired", () => {
  const item = newCreativeNotice("code-931", "title-53");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
