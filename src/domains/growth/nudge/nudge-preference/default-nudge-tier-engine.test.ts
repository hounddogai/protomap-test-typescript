import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultNudgeTierEngine } from "./default-nudge-tier-engine.js";
import { newDefaultNudgeTier } from "./default-nudge-tier.js";

test("DefaultNudgeTierEngine keeps results within bounds", () => {
  const engine = defaultDefaultNudgeTierEngine(flags.newRegistry());
  const item = newDefaultNudgeTier("code-733", "label-425");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
