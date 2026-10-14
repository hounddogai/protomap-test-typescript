import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedBadgeDigestEngine } from "./capped-badge-digest-engine.js";
import { newCappedBadgeDigest } from "./capped-badge-digest.js";

test("CappedBadgeDigestEngine keeps results within bounds", () => {
  const engine = defaultCappedBadgeDigestEngine(flags.newRegistry());
  const item = newCappedBadgeDigest("code-142", "name-697");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
