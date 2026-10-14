import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceRecordEngine } from "./bounce-record-engine.js";
import { newBounceRecord } from "./bounce-record.js";

test("BounceRecordEngine keeps results within bounds", () => {
  const engine = defaultBounceRecordEngine(flags.newRegistry());
  const item = newBounceRecord("code-343", "label-218");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
