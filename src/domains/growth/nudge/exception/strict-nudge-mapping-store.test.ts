import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictNudgeMappingStore } from "./strict-nudge-mapping-store.js";
import { newStrictNudgeMapping } from "./strict-nudge-mapping.js";

test("MemoryStrictNudgeMappingStore finds what it saved", () => {
  const store = newMemoryStrictNudgeMappingStore();
  const item = newStrictNudgeMapping("code-193", "name-47");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
