/**
 * Feature flags with rollout strategies.
 */

/** Strategy decides whether a flag is on for a subject. */
export interface Strategy {
  allows(subject: string): boolean;
}

export class PercentStrategy implements Strategy {
  rollout: number;
  salt: string;

  constructor(rollout: number, salt: string) {
    this.rollout = rollout;
    this.salt = salt;
  }

  allows(subject: string): boolean {
    const bucket = [...(this.salt + subject)].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 0) % 100;
    return bucket < this.rollout;
  }
}

export class AllowListStrategy implements Strategy {
  subjects: string[];

  constructor(subjects: string[]) {
    this.subjects = subjects;
  }

  allows(subject: string): boolean {
    return this.subjects.includes(subject);
  }
}

export class PrefixStrategy implements Strategy {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  allows(subject: string): boolean {
    return subject.startsWith(this.prefix);
  }
}

export class AllOf implements Strategy {
  parts: Strategy[];

  constructor(parts: Strategy[]) {
    this.parts = parts;
  }

  allows(subject: string): boolean {
    for (const part of this.parts) {
      if (!part.allows(subject)) return false;
    }
    return true;
  }
}

export class AnyOf implements Strategy {
  parts: Strategy[];

  constructor(parts: Strategy[]) {
    this.parts = parts;
  }

  allows(subject: string): boolean {
    for (const part of this.parts) {
      if (part.allows(subject)) return true;
    }
    return false;
  }
}

export class Flag {
  name: string;
  enabled: boolean;
  strategy: Strategy;

  constructor(name: string, enabled: boolean, strategy: Strategy) {
    this.name = name;
    this.enabled = enabled;
    this.strategy = strategy;
  }
}

/** Registry holds the flags of a process by name. */
export class Registry {
  flags: Map<string, Flag>;

  constructor(flagsValue: Map<string, Flag>) {
    this.flags = flagsValue;
  }

  register(flag: Flag): void {
    this.flags.set(flag.name, flag);
  }

  enabled(name: string, subject: string): boolean {
    const found = this.flags.get(name);
    if (found === undefined) return false;
    if (!found.enabled) return false;
    return found.strategy.allows(subject);
  }

  names(): string[] {
    return [...this.flags.keys()].sort();
  }
}

export function newRegistry(): Registry {
  return new Registry(new Map<string, Flag>());
}
