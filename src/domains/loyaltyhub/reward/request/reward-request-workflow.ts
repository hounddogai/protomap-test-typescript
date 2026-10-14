import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRequestEngine, defaultRewardRequestEngine } from "./reward-request-engine.js";
import { RewardRequestValidator, defaultRewardRequestValidator } from "./reward-request-rules.js";
import { RewardRequestStore } from "./reward-request-store.js";

/** Moves reward requests through their life cycle and keeps a journal of what it did. */
export class RewardRequestService {
  store: RewardRequestStore;
  validator: RewardRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRequestEngine;

  constructor(
    store: RewardRequestStore,
    validator: RewardRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRequestEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward request ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRewardRequestService(store: RewardRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRequestService {
  return new RewardRequestService(
    store,
    defaultRewardRequestValidator(),
    clockValue,
    [],
    defaultRewardRequestEngine(flagsValue),
  );
}
