import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainGroupEngine } from "./domain-group-engine.js";
import { newDomainGroup } from "./domain-group.js";

test("DomainGroupEngine keeps results within bounds", () => {
  const engine = defaultDomainGroupEngine();
  const item = newDomainGroup("code-641", "label-219");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
