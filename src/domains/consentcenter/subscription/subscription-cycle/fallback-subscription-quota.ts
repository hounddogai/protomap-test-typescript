import * as text from "../../../../kit/text.js";

/** Where a fallback subscription quota is in its life cycle. */
export type FallbackSubscriptionQuotaStatus = "created" | "validated" | "published" | "retired";

/** A fallback subscription quota as the subscription team keeps it. */
export class FallbackSubscriptionQuota {
  code: string;
  title: string;
  rate: number;
  archived: boolean;
  visible: boolean;
  windowDays: number;
  reviewer: string;
  country: string;
  attempts: number;
  journeyId: string;
  tags: string[];
  status: FallbackSubscriptionQuotaStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    archived: boolean,
    visible: boolean,
    windowDays: number,
    reviewer: string,
    country: string,
    attempts: number,
    journeyId: string,
    tags: string[],
    status: FallbackSubscriptionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.archived = archived;
    this.visible = visible;
    this.windowDays = windowDays;
    this.reviewer = reviewer;
    this.country = country;
    this.attempts = attempts;
    this.journeyId = journeyId;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackSubscriptionQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackSubscriptionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback subscription quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round((this.attempts + this.windowDays) * 100) / 100;
  }

  copy(): FallbackSubscriptionQuota {
    return new FallbackSubscriptionQuota(
      this.code,
      this.title,
      this.rate,
      this.archived,
      this.visible,
      this.windowDays,
      this.reviewer,
      this.country,
      this.attempts,
      this.journeyId,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback subscription quota in status created. */
export function newFallbackSubscriptionQuota(code: string, title: string): FallbackSubscriptionQuota {
  return new FallbackSubscriptionQuota(code, title, 0, false, false, 0, "", "", 0, "", [], "created");
}
