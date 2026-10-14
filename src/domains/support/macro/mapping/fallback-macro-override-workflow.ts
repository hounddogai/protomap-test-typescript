import * as clock from "../../../../kit/clock.js";
import {
  FallbackMacroOverrideValidator,
  defaultFallbackMacroOverrideValidator,
} from "./fallback-macro-override-rules.js";
import { FallbackMacroOverrideStore } from "./fallback-macro-override-store.js";

/** Moves fallback macro overrides through their life cycle and keeps a journal of what it did. */
export class FallbackMacroOverrideWorkflow {
  store: FallbackMacroOverrideStore;
  validator: FallbackMacroOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackMacroOverrideStore,
    validator: FallbackMacroOverrideValidator,
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
      throw new Error(`fallback macro override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback macro override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newFallbackMacroOverrideWorkflow(store: FallbackMacroOverrideStore, clockValue: clock.Clock): FallbackMacroOverrideWorkflow {
  return new FallbackMacroOverrideWorkflow(store, defaultFallbackMacroOverrideValidator(), clockValue, []);
}
