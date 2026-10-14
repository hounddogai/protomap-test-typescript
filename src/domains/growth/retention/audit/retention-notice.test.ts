import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionNotice } from "./retention-notice.js";

test("RetentionNotice starts in proposed", () => {
  const item = newRetentionNotice("code-302", "name-628");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionNotice moves to rejected", () => {
  const item = newRetentionNotice("code-302", "name-628");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RetentionNotice rejects moves from withdrawn", () => {
  const item = newRetentionNotice("code-302", "name-628");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
