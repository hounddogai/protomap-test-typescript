import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainProfileEngine } from "./domain-profile-engine.js";
import { newDomainProfile } from "./domain-profile.js";

test("DomainProfileEngine keeps results within bounds", () => {
  const engine = defaultDomainProfileEngine();
  const item = newDomainProfile("code-441", "label-962");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
