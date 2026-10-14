import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveNudgePreferenceEngine,
  defaultAdaptiveNudgePreferenceEngine,
} from "./adaptive-nudge-preference-engine.js";
import {
  AdaptiveNudgePreferenceValidator,
  defaultAdaptiveNudgePreferenceValidator,
} from "./adaptive-nudge-preference-rules.js";
import { AdaptiveNudgePreferenceStore } from "./adaptive-nudge-preference-store.js";

/** Moves adaptive nudge preferences through their life cycle and keeps a journal of what it did. */
export class AdaptiveNudgePreferenceService {
  store: AdaptiveNudgePreferenceStore;
  validator: AdaptiveNudgePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveNudgePreferenceEngine;

  constructor(
    store: AdaptiveNudgePreferenceStore,
    validator: AdaptiveNudgePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveNudgePreferenceEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive nudge preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive nudge preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive nudge preference ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveNudgePreferenceService(store: AdaptiveNudgePreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveNudgePreferenceService {
  return new AdaptiveNudgePreferenceService(
    store,
    defaultAdaptiveNudgePreferenceValidator(),
    clockValue,
    [],
    defaultAdaptiveNudgePreferenceEngine(flagsValue),
  );
}
