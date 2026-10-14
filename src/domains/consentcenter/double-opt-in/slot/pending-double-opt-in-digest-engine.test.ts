import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingDoubleOptInDigestEngine } from "./pending-double-opt-in-digest-engine.js";
import { newPendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

test("PendingDoubleOptInDigestEngine keeps results within bounds", () => {
  const engine = defaultPendingDoubleOptInDigestEngine(flags.newRegistry());
  const item = newPendingDoubleOptInDigest("code-600", "label-103");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
