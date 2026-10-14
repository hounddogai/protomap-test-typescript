import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFrequencyCycleStore } from "./default-frequency-cycle-store.js";
import { newDefaultFrequencyCycle } from "./default-frequency-cycle.js";

test("MemoryDefaultFrequencyCycleStore finds what it saved", () => {
  const store = newMemoryDefaultFrequencyCycleStore();
  const item = newDefaultFrequencyCycle("code-764", "title-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
