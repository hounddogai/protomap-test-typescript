import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientComplaintOverrideEngine } from "./lenient-complaint-override-engine.js";
import { newLenientComplaintOverride } from "./lenient-complaint-override.js";

test("LenientComplaintOverrideEngine keeps results within bounds", () => {
  const engine = defaultLenientComplaintOverrideEngine(flags.newRegistry());
  const item = newLenientComplaintOverride("code-820", "name-154");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
