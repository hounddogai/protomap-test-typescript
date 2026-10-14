import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPostOverrideEngine } from "./default-post-override-engine.js";
import { newDefaultPostOverride } from "./default-post-override.js";

test("DefaultPostOverrideEngine keeps results within bounds", () => {
  const engine = defaultDefaultPostOverrideEngine(flags.newRegistry());
  const item = newDefaultPostOverride("code-582", "title-996");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
