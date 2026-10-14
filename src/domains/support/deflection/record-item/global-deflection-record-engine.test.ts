import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalDeflectionRecordEngine } from "./global-deflection-record-engine.js";
import { newGlobalDeflectionRecord } from "./global-deflection-record.js";

test("GlobalDeflectionRecordEngine keeps results within bounds", () => {
  const engine = defaultGlobalDeflectionRecordEngine();
  const item = newGlobalDeflectionRecord("code-298", "label-328");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
