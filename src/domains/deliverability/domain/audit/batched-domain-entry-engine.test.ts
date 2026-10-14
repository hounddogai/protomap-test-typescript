import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedDomainEntryEngine } from "./batched-domain-entry-engine.js";
import { newBatchedDomainEntry } from "./batched-domain-entry.js";

test("BatchedDomainEntryEngine keeps results within bounds", () => {
  const engine = defaultBatchedDomainEntryEngine(flags.newRegistry());
  const item = newBatchedDomainEntry("code-470", "name-33");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
