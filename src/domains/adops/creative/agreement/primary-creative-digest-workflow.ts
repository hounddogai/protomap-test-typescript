import * as clock from "../../../../kit/clock.js";
import { PrimaryCreativeDigestEngine, defaultPrimaryCreativeDigestEngine } from "./primary-creative-digest-engine.js";
import {
  PrimaryCreativeDigestValidator,
  defaultPrimaryCreativeDigestValidator,
} from "./primary-creative-digest-rules.js";
import { PrimaryCreativeDigestStore } from "./primary-creative-digest-store.js";

/** Moves primary creative digests through their life cycle and keeps a journal of what it did. */
export class PrimaryCreativeDigestWorkflow {
  store: PrimaryCreativeDigestStore;
  validator: PrimaryCreativeDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryCreativeDigestEngine;

  constructor(
    store: PrimaryCreativeDigestStore,
    validator: PrimaryCreativeDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryCreativeDigestEngine,
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
      throw new Error(`primary creative digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary creative digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary creative digest ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPrimaryCreativeDigestWorkflow(store: PrimaryCreativeDigestStore, clockValue: clock.Clock): PrimaryCreativeDigestWorkflow {
  return new PrimaryCreativeDigestWorkflow(
    store,
    defaultPrimaryCreativeDigestValidator(),
    clockValue,
    [],
    defaultPrimaryCreativeDigestEngine(),
  );
}
