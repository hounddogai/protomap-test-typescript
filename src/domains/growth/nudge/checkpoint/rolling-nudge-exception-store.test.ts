import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingNudgeExceptionStore } from "./rolling-nudge-exception-store.js";
import { newRollingNudgeException } from "./rolling-nudge-exception.js";

test("MemoryRollingNudgeExceptionStore finds what it saved", () => {
  const store = newMemoryRollingNudgeExceptionStore();
  const item = newRollingNudgeException("code-985", "title-823");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
