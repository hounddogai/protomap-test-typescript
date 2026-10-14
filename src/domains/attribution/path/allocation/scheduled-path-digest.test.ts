import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPathDigest } from "./scheduled-path-digest.js";

test("ScheduledPathDigest starts in created", () => {
  const item = newScheduledPathDigest("code-686", "title-875");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPathDigest moves to published", () => {
  const item = newScheduledPathDigest("code-686", "title-875");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ScheduledPathDigest rejects moves from retired", () => {
  const item = newScheduledPathDigest("code-686", "title-875");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
