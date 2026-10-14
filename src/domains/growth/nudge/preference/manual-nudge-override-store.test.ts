import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualNudgeOverrideStore } from "./manual-nudge-override-store.js";
import { newManualNudgeOverride } from "./manual-nudge-override.js";

test("MemoryManualNudgeOverrideStore finds what it saved", () => {
  const store = newMemoryManualNudgeOverrideStore();
  const item = newManualNudgeOverride("code-197", "label-607");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
