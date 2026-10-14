import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueDigestEngine } from "./queue-digest-engine.js";
import { newQueueDigest } from "./queue-digest.js";

test("QueueDigestEngine keeps results within bounds", () => {
  const engine = defaultQueueDigestEngine(flags.newRegistry());
  const item = newQueueDigest("code-295", "label-183");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
