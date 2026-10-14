import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveDomainGroupEngine } from "./adaptive-domain-group-engine.js";
import { newAdaptiveDomainGroup } from "./adaptive-domain-group.js";

test("AdaptiveDomainGroupEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDomainGroupEngine();
  const item = newAdaptiveDomainGroup("code-430", "title-300");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
