import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPostRecordEngine } from "./fallback-post-record-engine.js";
import { newFallbackPostRecord } from "./fallback-post-record.js";

test("FallbackPostRecordEngine keeps results within bounds", () => {
  const engine = defaultFallbackPostRecordEngine(flags.newRegistry());
  const item = newFallbackPostRecord("code-6", "label-373");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
