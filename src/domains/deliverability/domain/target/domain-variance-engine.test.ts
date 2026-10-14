import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainVarianceEngine } from "./domain-variance-engine.js";
import { newDomainVariance } from "./domain-variance.js";

test("DomainVarianceEngine keeps results within bounds", () => {
  const engine = defaultDomainVarianceEngine(flags.newRegistry());
  const item = newDomainVariance("code-138", "title-977");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
