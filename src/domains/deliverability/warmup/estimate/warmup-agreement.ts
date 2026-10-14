import * as text from "../../../../kit/text.js";

/** Where a warmup agreement is in its life cycle. */
export type WarmupAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A warmup agreement as the warmup team keeps it. */
export class WarmupAgreement {
  code: string;
  name: string;
  retries: number;
  budget: number;
  category: string;
  campaignRef: string;
  startsAt: number;
  durationMinutes: number;
  attempts: number;
  tags: string[];
  status: WarmupAgreementStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    budget: number,
    category: string,
    campaignRef: string,
    startsAt: number,
    durationMinutes: number,
    attempts: number,
    tags: string[],
    status: WarmupAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.budget = budget;
    this.category = category;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.retries * this.budget * 100) / 100;
  }

  copy(): WarmupAgreement {
    return new WarmupAgreement(
      this.code,
      this.name,
      this.retries,
      this.budget,
      this.category,
      this.campaignRef,
      this.startsAt,
      this.durationMinutes,
      this.attempts,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a warmup agreement in status new. */
export function newWarmupAgreement(code: string, name: string): WarmupAgreement {
  return new WarmupAgreement(code, name, 0, 0, "", "", 0, 0, 0, [], "new");
}
