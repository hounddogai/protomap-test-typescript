import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedDomainExceptionEngine } from "./weighted-domain-exception-engine.js";
import { newWeightedDomainException } from "./weighted-domain-exception.js";

test("WeightedDomainExceptionEngine keeps results within bounds", () => {
  const engine = defaultWeightedDomainExceptionEngine(flags.newRegistry());
  const item = newWeightedDomainException("code-138", "title-913");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
