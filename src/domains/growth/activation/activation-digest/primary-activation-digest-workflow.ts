import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PrimaryActivationDigestEngine,
  defaultPrimaryActivationDigestEngine,
} from "./primary-activation-digest-engine.js";
import {
  PrimaryActivationDigestValidator,
  defaultPrimaryActivationDigestValidator,
} from "./primary-activation-digest-rules.js";
import { PrimaryActivationDigestStore } from "./primary-activation-digest-store.js";

/** Moves primary activation digests through their life cycle and keeps a journal of what it did. */
export class PrimaryActivationDigestDesk {
  store: PrimaryActivationDigestStore;
  validator: PrimaryActivationDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryActivationDigestEngine;

  constructor(
    store: PrimaryActivationDigestStore,
    validator: PrimaryActivationDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryActivationDigestEngine,
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
      throw new Error(`primary activation digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary activation digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary activation digest ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPrimaryActivationDigestDesk(store: PrimaryActivationDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryActivationDigestDesk {
  return new PrimaryActivationDigestDesk(
    store,
    defaultPrimaryActivationDigestValidator(),
    clockValue,
    [],
    defaultPrimaryActivationDigestEngine(flagsValue),
  );
}
