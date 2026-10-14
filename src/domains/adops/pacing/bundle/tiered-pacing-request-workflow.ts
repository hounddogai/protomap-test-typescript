import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredPacingRequestEngine, defaultTieredPacingRequestEngine } from "./tiered-pacing-request-engine.js";
import { TieredPacingRequestValidator, defaultTieredPacingRequestValidator } from "./tiered-pacing-request-rules.js";
import { TieredPacingRequestStore } from "./tiered-pacing-request-store.js";

/** Moves tiered pacing requests through their life cycle and keeps a journal of what it did. */
export class TieredPacingRequestService {
  store: TieredPacingRequestStore;
  validator: TieredPacingRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredPacingRequestEngine;

  constructor(
    store: TieredPacingRequestStore,
    validator: TieredPacingRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredPacingRequestEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered pacing request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered pacing request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered pacing request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredPacingRequestService(store: TieredPacingRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredPacingRequestService {
  return new TieredPacingRequestService(
    store,
    defaultTieredPacingRequestValidator(),
    clockValue,
    [],
    defaultTieredPacingRequestEngine(flagsValue),
  );
}
