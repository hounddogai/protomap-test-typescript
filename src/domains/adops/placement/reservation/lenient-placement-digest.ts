import * as text from "../../../../kit/text.js";

/** Where a lenient placement digest is in its life cycle. */
export type LenientPlacementDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient placement digest, with what the planners need to act on it. */
export class LenientPlacementDigest {
  code: string;
  label: string;
  journeyId: string;
  ratio: number;
  startsAt: number;
  tags: string[];
  status: LenientPlacementDigestStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    ratio: number,
    startsAt: number,
    tags: string[],
    status: LenientPlacementDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.ratio = ratio;
    this.startsAt = startsAt;
    this.tags = tags;
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

  canMoveTo(next: LenientPlacementDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "in_progress";
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

  moveTo(next: LenientPlacementDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient placement digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round(this.startsAt * this.ratio * 100) / 100;
  }

  copy(): LenientPlacementDigest {
    return new LenientPlacementDigest(
      this.code,
      this.label,
      this.journeyId,
      this.ratio,
      this.startsAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient placement digest in status planned. */
export function newLenientPlacementDigest(code: string, label: string): LenientPlacementDigest {
  return new LenientPlacementDigest(code, label, "", 0, 0, [], "planned");
}
