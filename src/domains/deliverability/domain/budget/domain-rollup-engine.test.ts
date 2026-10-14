import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainRollupEngine } from "./domain-rollup-engine.js";
import { newDomainRollup } from "./domain-rollup.js";

test("DomainRollupEngine keeps results within bounds", () => {
  const engine = defaultDomainRollupEngine();
  const item = newDomainRollup("code-630", "label-417");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
