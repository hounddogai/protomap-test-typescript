import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientDeflectionRequestEngine } from "./lenient-deflection-request-engine.js";
import { newLenientDeflectionRequest } from "./lenient-deflection-request.js";

test("LenientDeflectionRequestEngine keeps results within bounds", () => {
  const engine = defaultLenientDeflectionRequestEngine(flags.newRegistry());
  const item = newLenientDeflectionRequest("code-422", "label-298");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
