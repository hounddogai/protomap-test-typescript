import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledDomainGroupEngine } from "./scheduled-domain-group-engine.js";
import { newScheduledDomainGroup } from "./scheduled-domain-group.js";

test("ScheduledDomainGroupEngine keeps results within bounds", () => {
  const engine = defaultScheduledDomainGroupEngine();
  const item = newScheduledDomainGroup("code-588", "name-953");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
