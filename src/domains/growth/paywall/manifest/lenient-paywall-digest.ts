import * as text from "../../../../kit/text.js";

/** Where a lenient paywall digest is in its life cycle. */
export type LenientPaywallDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient paywall digest and its current status. */
export class LenientPaywallDigest {
  code: string;
  label: string;
  startsAt: number;
  windowDays: number;
  score: number;
  channel: string;
  source: string;
  archived: boolean;
  description: string;
  unit: string;
  margin: number;
  status: LenientPaywallDigestStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    windowDays: number,
    score: number,
    channel: string,
    source: string,
    archived: boolean,
    description: string,
    unit: string,
    margin: number,
    status: LenientPaywallDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.windowDays = windowDays;
    this.score = score;
    this.channel = channel;
    this.source = source;
    this.archived = archived;
    this.description = description;
    this.unit = unit;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPaywallDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientPaywallDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient paywall digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.margin - this.score) * 100) / 100;
  }

  copy(): LenientPaywallDigest {
    return new LenientPaywallDigest(
      this.code,
      this.label,
      this.startsAt,
      this.windowDays,
      this.score,
      this.channel,
      this.source,
      this.archived,
      this.description,
      this.unit,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient paywall digest in status planned. */
export function newLenientPaywallDigest(code: string, label: string): LenientPaywallDigest {
  return new LenientPaywallDigest(code, label, 0, 0, 0, "", "", false, "", "", 0, "planned");
}
