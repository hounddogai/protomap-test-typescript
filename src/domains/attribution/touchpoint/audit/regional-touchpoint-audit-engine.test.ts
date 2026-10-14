import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalTouchpointAuditEngine } from "./regional-touchpoint-audit-engine.js";
import { newRegionalTouchpointAudit } from "./regional-touchpoint-audit.js";

test("RegionalTouchpointAuditEngine keeps results within bounds", () => {
  const engine = defaultRegionalTouchpointAuditEngine(flags.newRegistry());
  const item = newRegionalTouchpointAudit("code-952", "title-607");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
