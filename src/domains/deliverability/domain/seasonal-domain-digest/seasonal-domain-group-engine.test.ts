import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalDomainGroupEngine } from "./seasonal-domain-group-engine.js";
import { newSeasonalDomainGroup } from "./seasonal-domain-group.js";

test("SeasonalDomainGroupEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDomainGroupEngine();
  const item = newSeasonalDomainGroup("code-733", "title-448");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
