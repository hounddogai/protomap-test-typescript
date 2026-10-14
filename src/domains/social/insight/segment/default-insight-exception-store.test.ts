import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultInsightExceptionStore } from "./default-insight-exception-store.js";
import { newDefaultInsightException } from "./default-insight-exception.js";

test("MemoryDefaultInsightExceptionStore finds what it saved", () => {
  const store = newMemoryDefaultInsightExceptionStore();
  const item = newDefaultInsightException("code-226", "title-492");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
