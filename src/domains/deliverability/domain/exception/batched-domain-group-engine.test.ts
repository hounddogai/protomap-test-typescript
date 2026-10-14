import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedDomainGroupEngine } from "./batched-domain-group-engine.js";
import { newBatchedDomainGroup } from "./batched-domain-group.js";

test("BatchedDomainGroupEngine keeps results within bounds", () => {
  const engine = defaultBatchedDomainGroupEngine(flags.newRegistry());
  const item = newBatchedDomainGroup("code-321", "name-529");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
