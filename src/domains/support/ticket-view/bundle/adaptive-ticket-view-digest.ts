import * as text from "../../../../kit/text.js";

/** Where a adaptive ticket view digest is in its life cycle. */
export type AdaptiveTicketViewDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One adaptive ticket view digest, with what the planners need to act on it. */
export class AdaptiveTicketViewDigest {
  code: string;
  label: string;
  region: string;
  score: number;
  source: string;
  startsAt: number;
  ownerId: string;
  updatedAt: number;
  weight: number;
  name: string;
  locale: string;
  status: AdaptiveTicketViewDigestStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    score: number,
    source: string,
    startsAt: number,
    ownerId: string,
    updatedAt: number,
    weight: number,
    name: string,
    locale: string,
    status: AdaptiveTicketViewDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.score = score;
    this.source = source;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.name = name;
    this.locale = locale;
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

  canMoveTo(next: AdaptiveTicketViewDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveTicketViewDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive ticket view digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round(this.startsAt * this.score * 100) / 100;
  }

  copy(): AdaptiveTicketViewDigest {
    return new AdaptiveTicketViewDigest(
      this.code,
      this.label,
      this.region,
      this.score,
      this.source,
      this.startsAt,
      this.ownerId,
      this.updatedAt,
      this.weight,
      this.name,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive ticket view digest in status open. */
export function newAdaptiveTicketViewDigest(code: string, label: string): AdaptiveTicketViewDigest {
  return new AdaptiveTicketViewDigest(code, label, "", 0, "", 0, "", 0, 0, "", "", "open");
}
