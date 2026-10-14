import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientConversionAuditEngine } from "./lenient-conversion-audit-engine.js";
import { newLenientConversionAudit } from "./lenient-conversion-audit.js";

test("LenientConversionAuditEngine keeps results within bounds", () => {
  const engine = defaultLenientConversionAuditEngine(flags.newRegistry());
  const item = newLenientConversionAudit("code-254", "label-973");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
