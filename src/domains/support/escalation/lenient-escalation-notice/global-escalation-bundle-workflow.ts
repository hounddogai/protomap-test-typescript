import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalEscalationBundleEngine,
  defaultGlobalEscalationBundleEngine,
} from "./global-escalation-bundle-engine.js";
import {
  GlobalEscalationBundleValidator,
  defaultGlobalEscalationBundleValidator,
} from "./global-escalation-bundle-rules.js";
import { GlobalEscalationBundleStore } from "./global-escalation-bundle-store.js";

/** Moves global escalation bundles through their life cycle and keeps a journal of what it did. */
export class GlobalEscalationBundleManager {
  store: GlobalEscalationBundleStore;
  validator: GlobalEscalationBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalEscalationBundleEngine;

  constructor(
    store: GlobalEscalationBundleStore,
    validator: GlobalEscalationBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalEscalationBundleEngine,
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
      throw new Error(`global escalation bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global escalation bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global escalation bundle ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newGlobalEscalationBundleManager(store: GlobalEscalationBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalEscalationBundleManager {
  return new GlobalEscalationBundleManager(
    store,
    defaultGlobalEscalationBundleValidator(),
    clockValue,
    [],
    defaultGlobalEscalationBundleEngine(flagsValue),
  );
}
