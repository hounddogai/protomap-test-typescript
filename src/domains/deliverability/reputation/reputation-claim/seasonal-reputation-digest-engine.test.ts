import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalReputationDigestEngine } from "./seasonal-reputation-digest-engine.js";
import { newSeasonalReputationDigest } from "./seasonal-reputation-digest.js";

test("SeasonalReputationDigestEngine keeps results within bounds", () => {
  const engine = defaultSeasonalReputationDigestEngine();
  const item = newSeasonalReputationDigest("code-492", "title-389");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
