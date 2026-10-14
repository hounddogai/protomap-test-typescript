import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalConversionScoreStore } from "./regional-conversion-score-store.js";
import { newRegionalConversionScore } from "./regional-conversion-score.js";

test("MemoryRegionalConversionScoreStore finds what it saved", () => {
  const store = newMemoryRegionalConversionScoreStore();
  const item = newRegionalConversionScore("code-681", "label-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
