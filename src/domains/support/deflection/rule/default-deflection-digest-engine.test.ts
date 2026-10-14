import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultDeflectionDigestEngine } from "./default-deflection-digest-engine.js";
import { newDefaultDeflectionDigest } from "./default-deflection-digest.js";

test("DefaultDeflectionDigestEngine keeps results within bounds", () => {
  const engine = defaultDefaultDeflectionDigestEngine(flags.newRegistry());
  const item = newDefaultDeflectionDigest("code-718", "name-799");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
