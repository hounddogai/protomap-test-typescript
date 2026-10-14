import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledOptOutExceptionEngine } from "./scheduled-opt-out-exception-engine.js";
import { newScheduledOptOutException } from "./scheduled-opt-out-exception.js";

test("ScheduledOptOutExceptionEngine keeps results within bounds", () => {
  const engine = defaultScheduledOptOutExceptionEngine();
  const item = newScheduledOptOutException("code-772", "title-325");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
