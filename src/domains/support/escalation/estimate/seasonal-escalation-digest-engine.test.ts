import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalEscalationDigestEngine } from "./seasonal-escalation-digest-engine.js";
import { newSeasonalEscalationDigest } from "./seasonal-escalation-digest.js";

test("SeasonalEscalationDigestEngine keeps results within bounds", () => {
  const engine = defaultSeasonalEscalationDigestEngine();
  const item = newSeasonalEscalationDigest("code-710", "name-46");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
