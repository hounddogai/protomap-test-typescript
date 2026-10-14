import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryJourneyAuditEngine } from "./primary-journey-audit-engine.js";
import { newPrimaryJourneyAudit } from "./primary-journey-audit.js";

test("PrimaryJourneyAuditEngine keeps results within bounds", () => {
  const engine = defaultPrimaryJourneyAuditEngine(flags.newRegistry());
  const item = newPrimaryJourneyAudit("code-49", "label-777");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
