import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightWindowStore } from "./insight-window-store.js";
import { newInsightWindow } from "./insight-window.js";

test("MemoryInsightWindowStore finds what it saved", () => {
  const store = newMemoryInsightWindowStore();
  const item = newInsightWindow("code-763", "title-118");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
