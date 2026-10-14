import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedMentionAuditEngine } from "./weighted-mention-audit-engine.js";
import { newWeightedMentionAudit } from "./weighted-mention-audit.js";

test("WeightedMentionAuditEngine keeps results within bounds", () => {
  const engine = defaultWeightedMentionAuditEngine(flags.newRegistry());
  const item = newWeightedMentionAudit("code-232", "label-839");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
