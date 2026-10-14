import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientEnrollmentDigestEngine } from "./lenient-enrollment-digest-engine.js";
import { newLenientEnrollmentDigest } from "./lenient-enrollment-digest.js";

test("LenientEnrollmentDigestEngine keeps results within bounds", () => {
  const engine = defaultLenientEnrollmentDigestEngine(flags.newRegistry());
  const item = newLenientEnrollmentDigest("code-474", "label-259");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
