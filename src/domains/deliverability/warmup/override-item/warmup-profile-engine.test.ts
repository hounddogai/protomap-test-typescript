import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupProfileEngine } from "./warmup-profile-engine.js";
import { newWarmupProfile } from "./warmup-profile.js";

test("WarmupProfileEngine keeps results within bounds", () => {
  const engine = defaultWarmupProfileEngine(flags.newRegistry());
  const item = newWarmupProfile("code-940", "name-18");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
