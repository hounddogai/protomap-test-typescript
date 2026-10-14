import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingNudgeMappingStore } from "./rolling-nudge-mapping-store.js";
import { newRollingNudgeMapping } from "./rolling-nudge-mapping.js";

test("MemoryRollingNudgeMappingStore finds what it saved", () => {
  const store = newMemoryRollingNudgeMappingStore();
  const item = newRollingNudgeMapping("code-515", "title-883");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
