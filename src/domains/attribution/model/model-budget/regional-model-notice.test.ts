import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalModelNotice } from "./regional-model-notice.js";

test("RegionalModelNotice starts in created", () => {
  const item = newRegionalModelNotice("code-903", "label-224");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalModelNotice moves to validated", () => {
  const item = newRegionalModelNotice("code-903", "label-224");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalModelNotice rejects moves from retired", () => {
  const item = newRegionalModelNotice("code-903", "label-224");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
