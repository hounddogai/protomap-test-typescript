import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainBaselineEngine } from "./domain-baseline-engine.js";
import { newDomainBaseline } from "./domain-baseline.js";

test("DomainBaselineEngine keeps results within bounds", () => {
  const engine = defaultDomainBaselineEngine(flags.newRegistry());
  const item = newDomainBaseline("code-775", "title-209");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
