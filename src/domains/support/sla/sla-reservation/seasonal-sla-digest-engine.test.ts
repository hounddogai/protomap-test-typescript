import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalSlaDigestEngine } from "./seasonal-sla-digest-engine.js";
import { newSeasonalSlaDigest } from "./seasonal-sla-digest.js";

test("SeasonalSlaDigestEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSlaDigestEngine();
  const item = newSeasonalSlaDigest("code-268", "name-525");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
