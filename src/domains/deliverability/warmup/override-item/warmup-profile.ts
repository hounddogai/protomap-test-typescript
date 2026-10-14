import * as text from "../../../../kit/text.js";

/** Where a warmup profile is in its life cycle. */
export type WarmupProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A warmup profile. Its code is unique within a tenant. */
export class WarmupProfile {
  code: string;
  name: string;
  rate: number;
  sequence: number;
  ratio: number;
  tags: string[];
  phone: string;
  retries: number;
  budget: number;
  graceDays: number;
  status: WarmupProfileStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    sequence: number,
    ratio: number,
    tags: string[],
    phone: string,
    retries: number,
    budget: number,
    graceDays: number,
    status: WarmupProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.sequence = sequence;
    this.ratio = ratio;
    this.tags = tags;
    this.phone = phone;
    this.retries = retries;
    this.budget = budget;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupProfileStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WarmupProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"warmup profile"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.budget - this.ratio) * 100) / 100;
  }

  copy(): WarmupProfile {
    return new WarmupProfile(
      this.code,
      this.name,
      this.rate,
      this.sequence,
      this.ratio,
      this.tags,
      this.phone,
      this.retries,
      this.budget,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a warmup profile in status open. */
export function newWarmupProfile(code: string, name: string): WarmupProfile {
  return new WarmupProfile(code, name, 0, 0, 0, [], "", 0, 0, 0, "open");
}
