import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPaywallCheckpointEngine } from "./default-paywall-checkpoint-engine.js";
import { newDefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

test("DefaultPaywallCheckpointEngine keeps results within bounds", () => {
  const engine = defaultDefaultPaywallCheckpointEngine(flags.newRegistry());
  const item = newDefaultPaywallCheckpoint("code-642", "name-734");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
