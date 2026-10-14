import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalInsightGroupStore } from "./regional-insight-group-store.js";
import { newRegionalInsightGroup } from "./regional-insight-group.js";

test("MemoryRegionalInsightGroupStore finds what it saved", () => {
  const store = newMemoryRegionalInsightGroupStore();
  const item = newRegionalInsightGroup("code-779", "label-134");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
