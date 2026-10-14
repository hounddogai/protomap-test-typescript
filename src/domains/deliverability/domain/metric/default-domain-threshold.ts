import * as text from "../../../../kit/text.js";

/** Where a default domain threshold is in its life cycle. */
export type DefaultDomainThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One default domain threshold, with what the planners need to act on it. */
export class DefaultDomainThreshold {
  code: string;
  title: string;
  externalRef: string;
  approved: boolean;
  tags: string[];
  journeyId: string;
  endsAt: number;
  startsAt: number;
  maximum: number;
  status: DefaultDomainThresholdStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    approved: boolean,
    tags: string[],
    journeyId: string,
    endsAt: number,
    startsAt: number,
    maximum: number,
    status: DefaultDomainThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.approved = approved;
    this.tags = tags;
    this.journeyId = journeyId;
    this.endsAt = endsAt;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultDomainThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DefaultDomainThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default domain threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.endsAt * this.maximum * 100) / 100;
  }

  copy(): DefaultDomainThreshold {
    return new DefaultDomainThreshold(
      this.code,
      this.title,
      this.externalRef,
      this.approved,
      this.tags,
      this.journeyId,
      this.endsAt,
      this.startsAt,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default domain threshold in status idle. */
export function newDefaultDomainThreshold(code: string, title: string): DefaultDomainThreshold {
  return new DefaultDomainThreshold(code, title, "", false, [], "", 0, 0, 0, "idle");
}
