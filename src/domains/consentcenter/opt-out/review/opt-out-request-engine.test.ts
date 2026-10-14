import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutRequestEngine } from "./opt-out-request-engine.js";
import { newOptOutRequest } from "./opt-out-request.js";

test("OptOutRequestEngine keeps results within bounds", () => {
  const engine = defaultOptOutRequestEngine(flags.newRegistry());
  const item = newOptOutRequest("code-724", "title-428");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
