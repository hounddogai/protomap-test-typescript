import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationProfileEngine } from "./escalation-profile-engine.js";
import { newEscalationProfile } from "./escalation-profile.js";

test("EscalationProfileEngine keeps results within bounds", () => {
  const engine = defaultEscalationProfileEngine(flags.newRegistry());
  const item = newEscalationProfile("code-351", "title-756");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
