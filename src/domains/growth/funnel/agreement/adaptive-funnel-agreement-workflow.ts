import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveFunnelAgreementEngine,
  defaultAdaptiveFunnelAgreementEngine,
} from "./adaptive-funnel-agreement-engine.js";
import {
  AdaptiveFunnelAgreementValidator,
  defaultAdaptiveFunnelAgreementValidator,
} from "./adaptive-funnel-agreement-rules.js";
import { AdaptiveFunnelAgreementStore } from "./adaptive-funnel-agreement-store.js";

/** Moves adaptive funnel agreements through their life cycle and keeps a journal of what it did. */
export class AdaptiveFunnelAgreementService {
  store: AdaptiveFunnelAgreementStore;
  validator: AdaptiveFunnelAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveFunnelAgreementEngine;

  constructor(
    store: AdaptiveFunnelAgreementStore,
    validator: AdaptiveFunnelAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveFunnelAgreementEngine,
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
      throw new Error(`adaptive funnel agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive funnel agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive funnel agreement ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newAdaptiveFunnelAgreementService(store: AdaptiveFunnelAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveFunnelAgreementService {
  return new AdaptiveFunnelAgreementService(
    store,
    defaultAdaptiveFunnelAgreementValidator(),
    clockValue,
    [],
    defaultAdaptiveFunnelAgreementEngine(flagsValue),
  );
}
