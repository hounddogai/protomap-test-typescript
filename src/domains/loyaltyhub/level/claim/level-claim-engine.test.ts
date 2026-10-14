import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelClaimEngine } from "./level-claim-engine.js";
import { newLevelClaim } from "./level-claim.js";

test("LevelClaimEngine keeps results within bounds", () => {
  const engine = defaultLevelClaimEngine(flags.newRegistry());
  const item = newLevelClaim("code-844", "title-421");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
