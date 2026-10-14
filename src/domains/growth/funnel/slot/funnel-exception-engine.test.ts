import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelExceptionEngine } from "./funnel-exception-engine.js";
import { newFunnelException } from "./funnel-exception.js";

test("FunnelExceptionEngine keeps results within bounds", () => {
  const engine = defaultFunnelExceptionEngine(flags.newRegistry());
  const item = newFunnelException("code-291", "label-546");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
