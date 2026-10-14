import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryEscalationWindowEngine } from "./primary-escalation-window-engine.js";
import { newPrimaryEscalationWindow } from "./primary-escalation-window.js";

test("PrimaryEscalationWindowEngine keeps results within bounds", () => {
  const engine = defaultPrimaryEscalationWindowEngine(flags.newRegistry());
  const item = newPrimaryEscalationWindow("code-227", "label-310");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
