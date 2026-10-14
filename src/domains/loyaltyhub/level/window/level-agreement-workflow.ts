import * as clock from "../../../../kit/clock.js";
import { LevelAgreementEngine, defaultLevelAgreementEngine } from "./level-agreement-engine.js";
import { LevelAgreementValidator, defaultLevelAgreementValidator } from "./level-agreement-rules.js";
import { LevelAgreementStore } from "./level-agreement-store.js";

/** Moves level agreements through their life cycle and keeps a journal of what it did. */
export class LevelAgreementService {
  store: LevelAgreementStore;
  validator: LevelAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelAgreementEngine;

  constructor(
    store: LevelAgreementStore,
    validator: LevelAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelAgreementEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level agreement ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLevelAgreementService(store: LevelAgreementStore, clockValue: clock.Clock): LevelAgreementService {
  return new LevelAgreementService(
    store,
    defaultLevelAgreementValidator(),
    clockValue,
    [],
    defaultLevelAgreementEngine(),
  );
}
