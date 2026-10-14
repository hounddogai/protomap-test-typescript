import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPostOverride } from "./default-post-override.js";

test("DefaultPostOverride starts in planned", () => {
  const item = newDefaultPostOverride("code-582", "title-996");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPostOverride moves to cancelled", () => {
  const item = newDefaultPostOverride("code-582", "title-996");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("DefaultPostOverride rejects moves from cancelled", () => {
  const item = newDefaultPostOverride("code-582", "title-996");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
