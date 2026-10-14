import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalWindowAuditEngine } from "./regional-window-audit-engine.js";
import { newRegionalWindowAudit } from "./regional-window-audit.js";

test("RegionalWindowAuditEngine keeps results within bounds", () => {
  const engine = defaultRegionalWindowAuditEngine(flags.newRegistry());
  const item = newRegionalWindowAudit("code-438", "name-718");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
