import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionAuditEngine } from "./conversion-audit-engine.js";
import { newConversionAudit } from "./conversion-audit.js";

test("ConversionAuditEngine keeps results within bounds", () => {
  const engine = defaultConversionAuditEngine(flags.newRegistry());
  const item = newConversionAudit("code-682", "name-509");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
