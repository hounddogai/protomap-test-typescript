import * as text from "../../../../kit/text.js";

/** Where a manual badge tier is in its life cycle. */
export type ManualBadgeTierStatus = "requested" | "granted" | "revoked" | "expired";

/** One manual badge tier, with what the planners need to act on it. */
export class ManualBadgeTier {
  code: string;
  name: string;
  maximum: number;
  ceiling: number;
  tags: string[];
  status: ManualBadgeTierStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    ceiling: number,
    tags: string[],
    status: ManualBadgeTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.ceiling = ceiling;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualBadgeTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualBadgeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual badge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.ceiling - this.maximum) * 100) / 100;
  }

  copy(): ManualBadgeTier {
    return new ManualBadgeTier(this.code, this.name, this.maximum, this.ceiling, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual badge tier in status requested. */
export function newManualBadgeTier(code: string, name: string): ManualBadgeTier {
  return new ManualBadgeTier(code, name, 0, 0, [], "requested");
}
