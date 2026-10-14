import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalDeflectionRecordEngine } from "./regional-deflection-record-engine.js";
import { newRegionalDeflectionRecord } from "./regional-deflection-record.js";

test("RegionalDeflectionRecordEngine keeps results within bounds", () => {
  const engine = defaultRegionalDeflectionRecordEngine();
  const item = newRegionalDeflectionRecord("code-841", "label-541");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
