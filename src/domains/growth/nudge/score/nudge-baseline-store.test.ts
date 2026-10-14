import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeBaselineStore } from "./nudge-baseline-store.js";
import { newNudgeBaseline } from "./nudge-baseline.js";

test("MemoryNudgeBaselineStore finds what it saved", () => {
  const store = newMemoryNudgeBaselineStore();
  const item = newNudgeBaseline("code-965", "title-988");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
