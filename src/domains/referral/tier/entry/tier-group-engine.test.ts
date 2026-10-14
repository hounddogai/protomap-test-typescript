import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierGroupEngine } from "./tier-group-engine.js";
import { newTierGroup } from "./tier-group.js";

test("TierGroupEngine keeps results within bounds", () => {
  const engine = defaultTierGroupEngine(flags.newRegistry());
  const item = newTierGroup("code-94", "title-660");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
