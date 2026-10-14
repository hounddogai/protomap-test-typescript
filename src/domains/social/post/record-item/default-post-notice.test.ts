import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPostNotice } from "./default-post-notice.js";

test("DefaultPostNotice starts in requested", () => {
  const item = newDefaultPostNotice("code-724", "title-635");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPostNotice moves to granted", () => {
  const item = newDefaultPostNotice("code-724", "title-635");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DefaultPostNotice rejects moves from expired", () => {
  const item = newDefaultPostNotice("code-724", "title-635");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
