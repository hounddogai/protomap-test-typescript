import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientFlightExceptionStore } from "./lenient-flight-exception-store.js";
import { newLenientFlightException } from "./lenient-flight-exception.js";

test("MemoryLenientFlightExceptionStore finds what it saved", () => {
  const store = newMemoryLenientFlightExceptionStore();
  const item = newLenientFlightException("code-78", "title-89");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
