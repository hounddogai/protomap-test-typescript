import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualDoubleOptInEntry } from "./manual-double-opt-in-entry.js";

test("ManualDoubleOptInEntry starts in created", () => {
  const item = newManualDoubleOptInEntry("code-100", "title-871");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualDoubleOptInEntry moves to published", () => {
  const item = newManualDoubleOptInEntry("code-100", "title-871");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualDoubleOptInEntry rejects moves from retired", () => {
  const item = newManualDoubleOptInEntry("code-100", "title-871");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
