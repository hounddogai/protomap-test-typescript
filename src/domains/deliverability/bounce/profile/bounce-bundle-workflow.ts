import * as clock from "../../../../kit/clock.js";
import { BounceBundleValidator, defaultBounceBundleValidator } from "./bounce-bundle-rules.js";
import { BounceBundleStore } from "./bounce-bundle-store.js";

/** Moves bounce bundles through their life cycle and keeps a journal of what it did. */
export class BounceBundleCoordinator {
  store: BounceBundleStore;
  validator: BounceBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BounceBundleStore,
    validator: BounceBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBounceBundleCoordinator(store: BounceBundleStore, clockValue: clock.Clock): BounceBundleCoordinator {
  return new BounceBundleCoordinator(store, defaultBounceBundleValidator(), clockValue, []);
}
